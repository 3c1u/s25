//! I/O alternative for no_std environment.
use byteorder::ByteOrder;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    UnexpectedEof,
    Interrupted,
    Other,
}

pub type Result<T> = core::result::Result<T, Error>;

/// Read trait.
pub trait Read {
    /// Read bytes into the given buffer slice.
    fn read(&mut self, buf: &mut [u8]) -> Result<usize>;

    fn read_exact(&mut self, mut buf: &mut [u8]) -> Result<()> {
        while !buf.is_empty() {
            match self.read(buf) {
                Ok(0) => break,
                Ok(n) => {
                    let tmp = buf;
                    buf = &mut tmp[n..];
                }
                Err(Error::Interrupted) => {}
                Err(e) => return Err(e),
            }
        }
        if !buf.is_empty() {
            Err(Error::UnexpectedEof)
        } else {
            Ok(())
        }
    }

    fn read_u8(&mut self) -> Result<u8> {
        let mut b = [0u8];
        self.read_exact(&mut b)?;
        Ok(b[0])
    }

    fn read_u16<T: ByteOrder>(&mut self) -> Result<u16> {
        let mut b = [0u8; 2];
        self.read_exact(&mut b)?;
        Ok(T::read_u16(&b))
    }

    fn read_u32<T: ByteOrder>(&mut self) -> Result<u32> {
        let mut b = [0u8; 4];
        self.read_exact(&mut b)?;
        Ok(T::read_u32(&b))
    }

    fn read_u64<T: ByteOrder>(&mut self) -> Result<u64> {
        let mut b = [0u8; 4];
        self.read_exact(&mut b)?;
        Ok(T::read_u64(&b))
    }

    fn read_i8(&mut self) -> Result<i8> {
        Ok(self.read_u8()? as i8)
    }

    fn read_i16<T: ByteOrder>(&mut self) -> Result<i16> {
        Ok(self.read_u16::<T>()? as i16)
    }

    fn read_i32<T: ByteOrder>(&mut self) -> Result<i32> {
        Ok(self.read_u32::<T>()? as i32)
    }

    fn read_i64<T: ByteOrder>(&mut self) -> Result<i64> {
        Ok(self.read_u64::<T>()? as i64)
    }
}

#[derive(Clone, Copy, Debug)]
pub enum SeekFrom {
    Start(u64),
    End(i64),
    Current(i64),
}

/// Seek trait.
pub trait Seek {
    /// Seek to the given position. Returns a current position.
    fn seek(&mut self, position: SeekFrom) -> Result<u64>;
}

#[cfg(feature = "std")]
impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        match e.kind() {
            std::io::ErrorKind::UnexpectedEof => Self::UnexpectedEof,
            std::io::ErrorKind::Interrupted => Self::Interrupted,
            _ => Self::Other,
        }
    }
}

#[cfg(feature = "std")]
impl<T: std::io::Read> Read for T {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize> {
        Ok(std::io::Read::read(self, buf)?)
    }
}

#[cfg(feature = "std")]
impl<T: std::io::Seek> Seek for T {
    fn seek(&mut self, pos: SeekFrom) -> Result<u64> {
        Ok(std::io::Seek::seek(self, match pos {
            SeekFrom::Start(p) => std::io::SeekFrom::Start(p),
            SeekFrom::End(p) => std::io::SeekFrom::End(p),
            SeekFrom::Current(p) => std::io::SeekFrom::Current(p),
        })?)
    }
}
