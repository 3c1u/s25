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
