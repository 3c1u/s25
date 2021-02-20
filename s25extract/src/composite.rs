use crate::image::Image;
use s25::S25Archive;
use std::fs::File;
use std::path::Path;

pub fn main(input: &Path, output: &Path, layers: &str) {
    let mut s25 = S25Archive::open(input).expect("failed to open S25 archive");

    let layers: Vec<_> = layers.split(',').flat_map(str::parse::<usize>).collect();
    let mut images: Vec<(Vec<u8>, isize, isize, usize, usize)> = vec![];
    let mut width: i32 = 0;
    let mut height: i32 = 0;
    let mut offset_x: i32 = 0;
    let mut offset_y: i32 = 0;

    for id in layers {
        let image = s25.load_image(id).expect("failed to load an image");
        let metadata = &image.metadata;
        if metadata.offset_x < offset_x {
            let delta = -metadata.offset_x;
            width += delta;
            for (_, x, _, _, _) in &mut images {
                *x += delta as isize;
            }
            offset_x = metadata.offset_x;
        }

        width = width.max(metadata.offset_x + metadata.width - offset_x);

        if metadata.offset_y < offset_y {
            let delta = -metadata.offset_y;
            width += delta;
            for (_, _, y, _, _) in &mut images {
                *y += delta as isize;
            }
            offset_y = metadata.offset_y;
        }

        height = height.max(metadata.offset_y + metadata.height - offset_y);

        let image = image.rgba_buffer();
        images.push((
            image,
            (metadata.offset_x - offset_x) as isize,
            (metadata.offset_y - offset_y) as isize,
            metadata.width as usize,
            metadata.height as usize,
        ))
    }

    let mut res = Image::new(width as usize, height as usize);
    for (buffer, x, y, width, height) in images {
        res.draw_image_buffer(&buffer, (x, y), (width, height));
    }

    let file = File::create(output).expect("failed to create PNG");
    let mut encoder = png::Encoder::new(file, width as u32, height as u32);
    encoder.set_color(png::ColorType::RGBA);
    encoder.set_depth(png::BitDepth::Eight);
    let mut writer = encoder.write_header().unwrap();
    writer.write_image_data(&res.rgba_buffer).unwrap();
}
