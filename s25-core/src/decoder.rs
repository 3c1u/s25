use core::convert::TryFrom;

use crate::io::{Read, Seek, SeekFrom};
use crate::format::S25ImageMetadata;

use byteorder::LittleEndian;

pub fn decode_line(decode_buf: &[u8], buf: &mut [u8], offset: &mut usize, width: i32) {
    let mut decode_counter = 0usize;
    let mut count_remaining = width;

    while count_remaining > 0 && decode_counter < decode_buf.len() {
        // 偶数で正規化
        decode_counter += decode_counter & 0x01;

        let count =
            u16::from_le_bytes(*<&[u8; 2]>::try_from(&decode_buf[decode_counter..][..2]).unwrap());
        decode_counter += 2;

        let (method, skip) = (count >> 13, (count >> 11) & 0x03);
        decode_counter += skip as usize;

        let count = {
            let count = count & 0x7ff;
            if count == 0 {
                // 拡張カウント
                let new_count = i32::from_le_bytes(
                    *<&[u8; 4]>::try_from(&decode_buf[decode_counter..][..4]).unwrap(),
                );
                decode_counter += 4;
                new_count
            } else {
                count as i32
            }
            .min(count_remaining)
        };

        count_remaining -= count;

        match method {
            2 => {
                // BGR
                for _ in 0..count {
                    if buf.len() < (*offset + 4) || decode_buf.len() <= (decode_counter + 2) {
                        break;
                    }

                    buf[*offset] = decode_buf[decode_counter];
                    buf[*offset + 1] = decode_buf[decode_counter + 1];
                    buf[*offset + 2] = decode_buf[decode_counter + 2];
                    buf[*offset + 3] = 0xff;

                    decode_counter += 3;
                    *offset += 4;
                }
            }
            3 => {
                // BGR fill
                if let [r, g, b] = decode_buf[decode_counter..][..3] {
                    decode_counter += 3;

                    for _ in 0..count {
                        if buf.len() < (*offset + 4) {
                            break;
                        }

                        buf[*offset] = r;
                        buf[*offset + 1] = g;
                        buf[*offset + 2] = b;
                        buf[*offset + 3] = 0xff;

                        *offset += 4;
                    }
                } else {
                    unreachable!();
                }
            }
            4 => {
                // ABGR
                for _ in 0..count {
                    if buf.len() < (*offset + 4) {
                        break;
                    }

                    buf[*offset] = decode_buf[decode_counter + 1];
                    buf[*offset + 1] = decode_buf[decode_counter + 2];
                    buf[*offset + 2] = decode_buf[decode_counter + 3];
                    buf[*offset + 3] = decode_buf[decode_counter + 0];

                    decode_counter += 4;
                    *offset += 4;
                }
            }
            5 => {
                // ABGR fill
                if let [a, r, g, b] = decode_buf[decode_counter..][..4] {
                    decode_counter += 4;

                    for _ in 0..count {
                        if buf.len() < (*offset + 4) {
                            break;
                        }

                        buf[*offset] = r;
                        buf[*offset + 1] = g;
                        buf[*offset + 2] = b;
                        buf[*offset + 3] = a;
                        *offset += 4;
                    }
                } else {
                    unreachable!();
                }
            }
            _ => {
                if count < 0 {
                    *offset -= (-count) as usize * 4;
                } else {
                    *offset += count as usize * 4;
                }
            }
        }
    }
}

pub fn unpack_non_incremental<R: Read + Seek>(file: &mut R, metadata: &S25ImageMetadata, buf: &mut [u8]) 
-> crate::io::Result<()> {
    const MAX_HEIGHT: usize = 4098;
    const MAX_ROW_BUF: usize = 16392;

    if metadata.height as usize > MAX_HEIGHT {
        panic!("cannot unpack an image with the height of more than MAX_HEIGHT.");
    }

    // データ開始位置にカーソルを移動
    file.seek(SeekFrom::Start(metadata.head as u64))?;

    // non-incrementalな画像エントリーをロードする
    let rows = &mut [0u32; MAX_HEIGHT][..];
    for i in 0..metadata.height as usize {
        rows[i] = file.read_u32::<LittleEndian>()?;
    }

    let mut offset = 0;

    rows.iter().try_for_each(|&row_offset| -> crate::io::Result<()> {
        file.seek(SeekFrom::Start(row_offset as u64))?;
        let row_length = file.read_u16::<LittleEndian>()?;

        let row_length = if row_offset & 0x01 != 0 {
            file.read_exact(&mut [0u8])?; // 1バイトだけ読み飛ばす
            row_length & (!0x01)
        } else {
            row_length
        } as usize;

        if row_length > MAX_ROW_BUF {
            panic!("cannot unpack an image with the row size of more than MAX_ROW_BUF.");
        }

        let mut decode_buf = &mut [0; MAX_ROW_BUF][..];
        file.read_exact(&mut decode_buf)?;

        decode_line(&decode_buf, buf, &mut offset, metadata.width);

        Ok(())
    })?;

    Ok(())
}
