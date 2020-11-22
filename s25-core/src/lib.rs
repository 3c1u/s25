#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
extern crate core;

#[cfg(any(feature = "alloc", feature = "std"))]
extern crate alloc;

pub mod decoder;
pub mod format;
pub mod io;
