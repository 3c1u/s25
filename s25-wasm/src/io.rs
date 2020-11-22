use js_sys::Uint8Array;
pub use s25_core::io::{self, *};

pub struct ArrayCursor {
    pub position: u32,
    pub array: Uint8Array,
}

impl ArrayCursor {
    pub fn new(array: Uint8Array) -> Self {
        Self {
            position: 0,
            array,
        }
    }
}

impl Read for ArrayCursor {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let size = buf.len();
        let len = self.array.length();

        for i in 0..size {
            let offset = i as u32 + self.position;
            if len <= offset {
                self.position += i as u32;
                return Ok(i);
            }
            buf[i] = self.array.get_index(offset) as u8;
        }

        self.position += size as u32;
        Ok(size)
    }
}

impl Seek for ArrayCursor {
    fn seek(&mut self, position: SeekFrom) -> io::Result<u64> {
        let len = self.array.length();
        let new_pos = match position {
            SeekFrom::Current(p) => (len as i64 + p) as u32,
            SeekFrom::End(p) => {
                if p > 0 && (len as i64) < p {
                    return Err(io::Error::Other);
                }

                (len as i64 + p) as u32
            }
            SeekFrom::Start(p) => p as u32,
        };

        if len <= new_pos {
            return Err(io::Error::Other);
        }

        self.position = new_pos;
        Ok(new_pos as u64)
    }
}

impl Read for &mut ArrayCursor {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize> {
        ArrayCursor::read(self, buf)
    }
}

impl Seek for &mut ArrayCursor {
    fn seek(&mut self, position: SeekFrom) -> Result<u64> {
        ArrayCursor::seek(self, position)
    }
}
