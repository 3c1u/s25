#![no_std]

extern crate alloc;
extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern crate js_sys;
extern crate wasm_bindgen;

pub mod io;

use byteorder::LittleEndian;
use js_sys::{Int32Array, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::io::{ArrayCursor, Read};

use alloc::vec;
use vec::Vec;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[wasm_bindgen]
pub struct S25 {
    cursor: ArrayCursor,
    entries: Vec<Option<i32>>,
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
// Metadata.
pub struct Metadata {
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

#[wasm_bindgen]
impl S25 {
    pub fn open(array: Uint8Array) -> Option<S25> {
        let mut cursor = ArrayCursor::new(array);

        let mut magic_buf = [0u8; 4];
        cursor.read_exact(&mut magic_buf).ok()?;
        if &magic_buf != s25_core::format::S25_MAGIC {
            return None;
        }

        let total_entries = cursor.read_i32::<LittleEndian>().ok()?;

        let mut entries = vec![];

        for _ in 0..total_entries {
            let mut offset = [0u8; 4];
            cursor.read_exact(&mut offset).ok()?;
            let offset = i32::from_le_bytes(offset);

            entries.push(if offset == 0 { None } else { Some(offset) });
        }

        Some(Self { cursor, entries })
    }

    pub fn total_entries(&self) -> u32 {
        self.entries.len() as u32
    }

    pub fn exists(&self, entry: u32) -> bool {
        self.entries
            .get(entry as usize)
            .copied()
            .flatten()
            .is_some()
    }

    pub fn get_size(&mut self, entry: u32) -> Option<Int32Array> {
        use s25_core::format::S25ImageMetadata;

        if !self.exists(entry) {
            return None;
        }

        let offset = self.entries.get(entry as usize).unwrap().unwrap();
        let metadata = S25ImageMetadata::read_from(&mut self.cursor, offset).ok()?;
        let size = &[metadata.width, metadata.height][..];

        Some(Int32Array::from(size))
    }

    pub fn get_metadata(&mut self, entry: u32) -> Option<Metadata> {
        use s25_core::format::S25ImageMetadata;

        if !self.exists(entry) {
            return None;
        }

        let offset = self.entries.get(entry as usize).unwrap().unwrap();
        let S25ImageMetadata {
            width,
            height,
            offset_x,
            offset_y,
            incremental,
            head,
        } = S25ImageMetadata::read_from(&mut self.cursor, offset).ok()?;

        Some(Metadata {
            width,
            height,
            offset_x,
            offset_y,
            incremental,
            head,
        })
    }

    pub fn decode(&mut self, entry: u32) -> Option<Uint8Array> {
        use s25_core::format::S25ImageMetadata;

        if !self.exists(entry) {
            return None;
        }

        let offset = self.entries.get(entry as usize).unwrap().unwrap();
        let metadata = S25ImageMetadata::read_from(&mut self.cursor, offset).ok()?;

        let mut buf = vec![0u8; (metadata.width * metadata.height * 4) as usize];

        s25_core::decoder::unpack_non_incremental(&mut self.cursor, &metadata, &mut buf).ok()?;

        Some(Uint8Array::from(&buf[..]))
    }

    pub fn decode_rgba(&mut self, entry: u32) -> Option<Uint8Array> {
        use s25_core::format::S25ImageMetadata;

        if !self.exists(entry) {
            return None;
        }

        let offset = self.entries.get(entry as usize).unwrap().unwrap();
        let metadata = S25ImageMetadata::read_from(&mut self.cursor, offset).ok()?;

        let mut buf = vec![0u8; (metadata.width * metadata.height * 4) as usize];

        s25_core::decoder::unpack_non_incremental(&mut self.cursor, &metadata, &mut buf).ok()?;

        for i in 0..(buf.len() >> 2) {
            let offset = i << 2;
            if let [b, g, r, a] = buf[offset..][..4] {
                buf[offset] = r;
                buf[offset + 1] = g;
                buf[offset + 2] = b;
                buf[offset + 3] = a;
            }
        }

        Some(Uint8Array::from(&buf[..]))
    }
}
