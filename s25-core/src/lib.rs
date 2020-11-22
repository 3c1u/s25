#![cfg_attr(not(feature = "std"), no_std)]
#[cfg(feature = "std")]
extern crate core;

pub mod decoder;
pub mod format;
pub mod io;
