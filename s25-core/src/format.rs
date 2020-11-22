/// Magic header for .S25 file.
pub const S25_MAGIC: &[u8; 4] = b"S25\0";

/// Bytes per pixel.
pub const S25_BYTES_PER_PIXEL: usize = 4;

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
    pub head: i32,
}

impl S25ImageMetadata {
    pub fn read_from<R: crate::io::Read + crate::io::Seek>(
        mut file: R,
        offset: i32,
    ) -> crate::io::Result<S25ImageMetadata> {
        use byteorder::LittleEndian;

        file.seek(crate::io::SeekFrom::Start(offset as u64))?;

        let width = file.read_i32::<LittleEndian>()?;
        let height = file.read_i32::<LittleEndian>()?;
        let offset_x = file.read_i32::<LittleEndian>()?;
        let offset_y = file.read_i32::<LittleEndian>()?;
        let incremental = 0 != (file.read_u32::<LittleEndian>()? & 0x80000000);

        Ok(S25ImageMetadata {
            width,
            height,
            offset_x,
            offset_y,
            incremental,
            head: offset + 0x14,
        })
    }
}
