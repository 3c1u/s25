#![deny(clippy::all)]

pub mod utils;

pub(crate) mod reader;
pub(crate) mod writer;

/// Result type.
pub type Result<T> = std::result::Result<T, Error>;

#[cfg(feature = "fail")]
use failure::Fail;

/// Error type.
#[cfg(feature = "fail")]
#[derive(Debug, Fail)]
pub enum Error {
    #[fail(display = "io error: {:?}", _0)]
    IoError(std::io::Error),
    #[fail(display = "invalid archive")]
    InvalidArchive,
    #[fail(display = "unsupported file format")]
    UnsupportedFileFormat,
    #[fail(display = "no entry")]
    NoEntry,
    #[fail(display = "compression failed")]
    CompressionFailed,
}

#[cfg(not(feature = "fail"))]
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
