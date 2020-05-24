#![deny(clippy::all)]

pub(crate) mod utils;

pub(crate) mod reader;
pub(crate) mod writer;

/// Result type.
pub type Result<T> = std::result::Result<T, Error>;

/// Error type.
#[derive(Debug)]
pub enum Error {
    IoError(std::io::Error),
    InvalidArchive,
    UnsupportedFileFormat,
    NoEntry,
    CompressionFailed,
}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Self::IoError(e)
    }
}

pub use reader::{S25Archive, S25Image, S25ImageMetadata};
pub use writer::S25Writer;
