use std::fs::File;
use std::io::{BufWriter, Seek, SeekFrom, Write};
use std::path::Path;

use std::collections::BTreeMap;

use crate::reader::{S25Image, S25ImageMetadata};
use crate::{Error, Result};

pub struct S25Writer<A = File>
where
    A: Write,
{
    file: BufWriter<A>,
    entries: BTreeMap<i32, S25ImageBuffer>,
}

#[derive(Clone)]
struct S25ImageBuffer {
    metadata: S25ImageMetadata,
    compressed: (Vec<u32>, Vec<u8>),
}

impl S25Writer {
    /// Creates a S25 writer.
    pub fn create<P: AsRef<Path>>(path: P) -> Result<Self> {
        Ok(Self {
            file: BufWriter::new(File::create(path)?),
            entries: BTreeMap::new(),
        })
    }
}

impl<T> From<T> for S25Writer<T>
where
    T: Write,
{
    fn from(t: T) -> Self {
        Self {
            file: BufWriter::new(t),
            entries: BTreeMap::new(),
        }
    }
}

use std::io::IntoInnerError;

impl<T> S25Writer<T>
where
    T: Write + Seek,
{
    /// Writes an S25 archive.
    pub fn write(&mut self) -> Result<()> {
        const S25_MAGIC: &[u8; 4] = b"S25\0";

        let mut buf_table: Vec<Option<S25ImageBuffer>> = vec![];
        let entries = std::mem::take(&mut self.entries);

        for entries in entries {
            let entry_no = entries.0 as usize;

            if buf_table.len() <= entry_no as usize {
                buf_table.resize(entry_no + 1, None);
            }

            buf_table[entry_no] = Some(entries.1);
        }

        let mut entry_table = vec![0i32; buf_table.len()];

        // write header
        self.file.seek(SeekFrom::Start(0))?;
        self.file.write_all(S25_MAGIC)?;

        // write total entries
        self.file
            .write_all(&(entry_table.len() as i32).to_le_bytes())?;

        // skip header (8 bytes) + entry table (4*entries bytes)
        self.file
            .seek(SeekFrom::Start(8 + entry_table.len() as u64 * 4))?;

        for (i, entry) in buf_table.into_iter().enumerate() {
            if let Some(entry) = entry {
                let head = self.file.seek(SeekFrom::Current(0))?;
                entry_table[i] = head as i32;

                // write metadata
                self.file.write_all(&entry.metadata.width.to_le_bytes())?;
                self.file.write_all(&entry.metadata.height.to_le_bytes())?;
                self.file
                    .write_all(&entry.metadata.offset_x.to_le_bytes())?;
                self.file
                    .write_all(&entry.metadata.offset_y.to_le_bytes())?;
                self.file.write_all(&(0i32).to_le_bytes())?;

                // write compressed image
                let img_head = (head + 0x14) as u32;
                for &offset in &entry.compressed.0 {
                    self.file.write_all(&(offset + img_head).to_le_bytes())?;
                }

                self.file.write_all(&entry.compressed.1)?;
            }
        }

        // go back to entry table
        self.file.seek(SeekFrom::Start(8))?;
        for pos in entry_table {
            self.file.write_all(&pos.to_le_bytes())?;
        }

        Ok(())
    }

    /// Unwraps the S25Writer and returns the underlying writer.
    pub fn into_inner(self) -> std::result::Result<T, IntoInnerError<BufWriter<T>>> {
        self.file.into_inner()
    }
}

impl<T> S25Writer<T>
where
    T: Write,
{
    pub fn add_entry(&mut self, entry_no: i32, image: &S25Image) -> Result<()> {
        let metadata = image.metadata.clone();

        assert!(metadata.width >= 0);
        assert!(metadata.height >= 0);

        let compressed = compress_image(
            &image.rgba_buffer,
            metadata.width as usize,
            metadata.height as usize,
        )?;

        self.entries.insert(
            entry_no as i32,
            S25ImageBuffer {
                metadata,
                compressed,
            },
        );

        Ok(())
    }
}

// const METHOD_BGR: u16 = 2;
// const METHOD_BGR_FILL: u16 = 3;
const METHOD_ABGR: u16 = 4;
// const METHOD_ABGR_FILL: u16 = 5;

fn compress_image(rgba_image: &[u8], width: usize, height: usize) -> Result<(Vec<u32>, Vec<u8>)> {
    use crate::utils;

    assert_eq!(rgba_image.len(), width * height * 4);

    let mut row_offsets = vec![0u32; height];

    let mut compress_buf = vec![];
    let mut row_buf = vec![];

    let row_data_offset = row_offsets.len() * 4;

    for y in 0..height {
        row_offsets[y] = (row_data_offset + compress_buf.len()) as u32;

        let head = y * width * 4;

        // TODO: implement PackBits encoding & RGB (no-alpha) support
        if width <= 0x7ff {
            utils::io::push_i16(
                &mut row_buf,
                encode_count(width as u16, METHOD_ABGR, 0) as i16,
            );
        } else if width <= 0xffffffff {
            // extended count
            utils::io::push_i16(&mut row_buf, encode_count(0, METHOD_ABGR, 0) as i16);
            utils::io::push_i32(&mut row_buf, width as i32);
        } else {
            return Err(Error::CompressionFailed);
        }

        for i in 0..width {
            let offset = i * 4 + head;

            row_buf.push(rgba_image[offset + 3]);
            row_buf.push(rgba_image[offset + 2]);
            row_buf.push(rgba_image[offset + 1]);
            row_buf.push(rgba_image[offset + 0]);
        }

        // write row length
        if row_buf.len() <= 0x7fff {
            utils::io::push_i16(&mut compress_buf, row_buf.len() as i16);
        } else {
            // row is too big
            return Err(Error::CompressionFailed);
        }

        // write row data
        compress_buf.append(&mut row_buf);
    }

    Ok((row_offsets, compress_buf))
}

fn encode_count(count: u16, method: u16, skip: u16) -> u16 {
    assert!(count <= 0x7ff);
    count & 0x7ff | (method << 13) | ((skip & 0x03) << 11)
}

#[test]
fn rewrite_susuko() {
    use crate::S25Archive;

    let mut writer = S25Writer::create("../test/susuko.s25").unwrap();
    let mut image = S25Archive::open("../test/SUSUKO_01LL.S25").unwrap();

    for i in 0..image.total_entries() {
        if let Ok(image) = image.load_image(i) {
            writer.add_entry(i as i32, &image).unwrap();
        }
    }

    writer.write().unwrap();
    drop(writer);

    let mut image2 = S25Archive::open("../test/susuko.s25").unwrap();
    for i in 0..image.total_entries() {
        let meta1 = image.load_image(i);
        let meta2 = image2.load_image(i);

        if let (Ok(mut meta1), Ok(mut meta2)) = (meta1, meta2) {
            meta1.metadata.head = 0;
            meta2.metadata.head = 0;

            assert_eq!(meta1.metadata, meta2.metadata, "metadata wrong at: {}", i);
            assert_eq!(
                meta1.rgba_buffer, meta2.rgba_buffer,
                "decode wrong at: {}",
                i
            );
        }
    }
}
