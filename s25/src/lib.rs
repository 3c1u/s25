#![deny(clippy::all)]

pub mod utils;

pub(crate) mod reader;
pub(crate) mod writer;

/// Result type.
pub type Result<T> = core::result::Result<T, Error>;

#[cfg(feature = "fail")]
use thiserror::Error;

/// Error type.
#[cfg(feature = "fail")]
#[derive(Debug, Error)]
pub enum Error {
    #[error("io error (s25_core): {0:?}")]
    IoError(s25_core::io::Error),
    #[error("io error (std): {0:?}")]
    StdIoError(std::io::Error),
    #[error("invalid archive")]
    InvalidArchive,
    #[error("unsupported file format")]
    UnsupportedFileFormat,
    #[error("no entry")]
    NoEntry,
    #[error("compression failed")]
    CompressionFailed,
}

#[cfg(not(feature = "fail"))]
#[derive(Debug)]
pub enum Error {
    IoError(s25_core::io::Error),
    #[cfg(feature = "std")]
    StdIoError(std::io::Error),
    InvalidArchive,
    UnsupportedFileFormat,
    NoEntry,
    CompressionFailed,
}

impl From<s25_core::io::Error> for Error {
    fn from(e: s25_core::io::Error) -> Self {
        Self::IoError(e)
    }
}

#[cfg(feature = "std")]
impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Self::StdIoError(e)
    }
}

pub use s25_core::format::S25ImageMetadata;
pub use reader::{S25Archive, S25Image};
pub use writer::S25Writer;
