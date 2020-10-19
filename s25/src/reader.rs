use std::fs::File;
use std::io::{BufReader, Read, Seek, SeekFrom};
use std::path::Path;

use crate::{decoder, utils, Error, Result};

const S25_MAGIC: &[u8; 4] = b"S25\0";
const S25_BYTES_PER_PIXEL: usize = 4;

/// An .S25 archive.
pub struct S25Archive<A = File> {
    file: BufReader<A>,
    entries: Vec<Option<i32>>,
}

impl<T> From<T> for S25Archive<T>
where
    T: Read + Seek,
{
    fn from(t: T) -> Self {
        Self {
            file: BufReader::new(t),
            entries: Default::default(),
        }
    }
}

impl S25Archive<File> {
    /// Opens an S25 archive.
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();

        let file = File::open(path)?;
        let mut file = BufReader::new(file);

        let mut magic_buf = [0u8; 4];
        file.read_exact(&mut magic_buf)?;
        if &magic_buf != S25_MAGIC {
            return Err(Error::InvalidArchive);
        }

        let total_entries = utils::io::read_i32(&mut file)?;

        let mut entries = vec![];

        for _ in 0..total_entries {
            let mut offset = [0u8; 4];
            file.read_exact(&mut offset)?;
            let offset = i32::from_le_bytes(offset);

            entries.push(if offset == 0 { None } else { Some(offset) });
        }

        Ok(S25Archive { file, entries })
    }
}

impl<'a> S25Archive<std::io::Cursor<&'a [u8]>> {
    /// Loads an S25 archive from raw bytes.
    pub fn from_raw_bytes<'b>(bytes: &'b [u8]) -> Result<Self>
    where
        'b: 'a,
    {
        use std::io::Cursor;

        let mut file = BufReader::new(Cursor::new(bytes));

        let mut magic_buf = [0u8; 4];
        file.read_exact(&mut magic_buf)?;
        if &magic_buf != S25_MAGIC {
            return Err(Error::InvalidArchive);
        }

        let total_entries = utils::io::read_i32(&mut file)?;

        let mut entries = vec![];

        for _ in 0..total_entries {
            let mut offset = [0u8; 4];
            file.read_exact(&mut offset)?;
            let offset = i32::from_le_bytes(offset);

            entries.push(if offset == 0 { None } else { Some(offset) });
        }

        Ok(S25Archive { file, entries })
    }
}

impl<A> S25Archive<A> {
    /// Returns the total entries in the archive.
    pub fn total_entries(&self) -> usize {
        self.entries.len()
    }

    /// Returns the total layers in the archive.
    pub fn total_layers(&self) -> usize {
        self.total_entries() / 100 + 1
    }
}

/// Metadata for an S25 image entry.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct S25ImageMetadata {
    /// Width.
    pub width: i32,
    /// Height.
    pub height: i32,
    /// X-axis value of the image offset.
    pub offset_x: i32,
    /// Y-axis value of the image offset.
    pub offset_y: i32,
    /// Whether the image uses incremental encoding.
    pub incremental: bool,
    /// Position of image.
    pub(crate) head: i32,
}

/// An S25 image entry.
#[derive(Clone)]
pub struct S25Image {
    /// Metadata.
    pub metadata: S25ImageMetadata,
    /// Uncompressed image buffer.
    pub bgra_buffer: Vec<u8>,
}

impl S25Image {
    pub fn rgba_buffer(&self) -> Vec<u8> {
        crate::utils::rgba_to_bgra(&self.bgra_buffer)
    }
}

impl<A> S25Archive<A>
where
    A: Read + Seek,
{
    /// Loads the metadata of an image entry.
    pub fn load_image_metadata(&mut self, entry: usize) -> Result<S25ImageMetadata> {
        let offset = self
            .entries
            .get(entry)
            .copied()
            .flatten()
            .ok_or(Error::NoEntry)?;

        self.file.seek(SeekFrom::Start(offset as u64))?;

        let width = utils::io::read_i32(&mut self.file)?;
        let height = utils::io::read_i32(&mut self.file)?;
        let offset_x = utils::io::read_i32(&mut self.file)?;
        let offset_y = utils::io::read_i32(&mut self.file)?;
        let incremental = 0 != (utils::io::read_i32(&mut self.file)? as u32 & 0x80000000);

        Ok(S25ImageMetadata {
            width,
            height,
            offset_x,
            offset_y,
            incremental,
            head: offset + 0x14,
        })
    }

    /// Loads an image entry.
    pub fn load_image(&mut self, entry: usize) -> Result<S25Image> {
        let metadata = self.load_image_metadata(entry)?;
        let mut buf = vec![0u8; (metadata.width * metadata.height) as usize * S25_BYTES_PER_PIXEL];

        self.unpack(&metadata, &mut buf)?;

        Ok(S25Image {
            metadata,
            bgra_buffer: buf,
        })
    }

    fn unpack(&mut self, metadata: &S25ImageMetadata, buf: &mut [u8]) -> Result<()> {
        // データ開始位置にカーソルを移動
        self.file.seek(SeekFrom::Start(metadata.head as u64))?;

        if metadata.incremental {
            return self.unpack_incremental(metadata, buf);
        }

        // non-incrementalな画像エントリーをロードする
        let mut rows = Vec::with_capacity(metadata.height as usize);
        for _ in 0..metadata.height {
            rows.push(utils::io::read_i32(&mut self.file)? as u32);
        }

        let mut offset = 0;

        rows
            .into_iter()
            .try_for_each(|row_offset| -> Result<()> {
                self.file.seek(SeekFrom::Start(row_offset as u64))?;
                let row_length = utils::io::read_i16(&mut self.file)? as u16;

                let row_length = if row_offset & 0x01 != 0 {
                    self.file.read_exact(&mut [0u8])?; // 1バイトだけ読み飛ばす
                    row_length & (!0x01)
                } else {
                    row_length
                };
                let mut decode_buf = vec![0; row_length as usize];
                self.file.read_exact(&mut decode_buf)?;

                decoder::decode_line(&decode_buf, buf, &mut offset, metadata.width);

                Ok(())
            })?;

        // すべての行を走査してデコードしていく
        // for row in rows {
        //     decoder::decode_line(&row?, buf, &mut offset, metadata.width);
        // }

        Ok(())
    }
    // fn read_line(&mut self) {}

    // incremental S25
    fn unpack_incremental(&mut self, metadata: &S25ImageMetadata, buf: &mut [u8]) -> Result<()> {
        let _ = metadata;
        let _ = buf;

        Err(Error::UnsupportedFileFormat)
    }
}

#[test]
fn read_touka() {
    let mut s25 = S25Archive::open("../test/KCG05.S25").unwrap();
    let image = s25.load_image(102).unwrap();

    let decoder = png::Decoder::new(File::open("../test/touka.png").unwrap());
    let (info, mut reader) = decoder.read_info().unwrap();
    let mut buf = vec![0u8; info.buffer_size()];
    reader.next_frame(&mut buf).unwrap();

    let image_2 = crate::utils::rgba_to_bgra(&buf);

    assert_eq!(image.bgra_buffer, image_2);
}
