pub mod io {
    use std::io::Read;

    pub fn read_i16<R: Read>(mut reader: R) -> std::io::Result<i16> {
        let mut buf = 0_i16.to_le_bytes();
        reader.read_exact(&mut buf)?;
        Ok(i16::from_le_bytes(buf))
    }

    pub fn read_i32<R: Read>(mut reader: R) -> std::io::Result<i32> {
        let mut buf = 0_i32.to_le_bytes();
        reader.read_exact(&mut buf)?;
        Ok(i32::from_le_bytes(buf))
    }

    pub fn push_i16(v: &mut Vec<u8>, a: i16) {
        let a = a.to_le_bytes();
        v.push(a[0]);
        v.push(a[1]);
    }

    pub fn push_i32(v: &mut Vec<u8>, a: i32) {
        let a = a.to_le_bytes();
        v.push(a[0]);
        v.push(a[1]);
        v.push(a[2]);
        v.push(a[3]);
    }
}
