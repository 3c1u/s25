pub(crate) mod io {
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

pub fn rgba_to_bgra(rgba: &[u8]) -> Vec<u8> {
    assert!(rgba.len() & 0x03 == 0);

    let mut bgra = vec![0; rgba.len()];

    for i in 0..(rgba.len() >> 2) {
        let i = i << 2;
        bgra[i] = rgba[i + 2];
        bgra[i + 1] = rgba[i + 1];
        bgra[i + 2] = rgba[i + 0];
        bgra[i + 3] = rgba[i + 3];
    }

    bgra
}
