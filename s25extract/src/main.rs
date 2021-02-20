#![warn(clippy::all)]

#[macro_use]
extern crate clap;

pub mod composite;
pub mod image;
pub mod utils;

use std::fs::File;
use std::path::Path;

use s25::S25Archive;

fn main() {
    let matches = clap_app!(s25extract =>
        (version: "0.1.0")
        (author: "Hikaru Terazono <3c1u@vulpesgames.toyko>")
        (about: "Extracts an .S25 archive.")
        (@arg INPUT: +required "Sets the input file")
        (@arg OUTPUT: -o --output +takes_value +required "Path to output")
        (@arg COMPOSITE: +takes_value "Composites the image. Pass the layer number like: 1,100,113")
    )
    .get_matches();

    let input = Path::new(matches.value_of("INPUT").unwrap());
    let output = Path::new(matches.value_of("OUTPUT").unwrap());
    let composite = matches.value_of("COMPOSITE");

    if let Some(composite) = composite {

        return composite::main(input, output, composite);
    }

    std::fs::create_dir_all(output).expect("failed to create the directory");

    let mut s25 = S25Archive::open(input).expect("failed to open S25 archive");

    for entry in 0..s25.total_entries() {
        if let Ok(img) = s25.load_image(entry) {
            let mut output_path = output.to_path_buf();
            output_path.push(format!(
                "{}@{}.png",
                input.file_stem().unwrap().to_str().unwrap(),
                entry
            ));

            let file = File::create(output_path).expect("failed to create PNG");

            let mut encoder =
                png::Encoder::new(file, img.metadata.width as u32, img.metadata.height as u32);
            encoder.set_color(png::ColorType::RGBA);
            encoder.set_depth(png::BitDepth::Eight);
            let mut writer = encoder.write_header().unwrap();
            writer
                .write_image_data(&s25::utils::rgba_to_bgra(&img.bgra_buffer))
                .unwrap();
        }
    }
}

#[test]
fn append_susuko() {
    use s25::S25Writer;

    let mut writer = S25Writer::create("../test/SUSUKO_01LL(1).s25").unwrap();
    let mut image = S25Archive::open("../test/SUSUKO_01LL.S25").unwrap();

    let decoder = png::Decoder::new(File::open("../susuko/SUSUKO_01LL@4.png").unwrap());
    let (info, mut reader) = decoder.read_info().unwrap();
    let mut buf = vec![0; info.buffer_size()];
    reader.next_frame(&mut buf).unwrap();

    for i in 0..image.total_entries() {
        if let Ok(image) = image.load_image(i) {
            writer.add_entry(i as i32, &image).unwrap();

            if i == 1 {
                let mut image = image.clone();
                image.rgba_buffer = s25::utils::rgba_to_bgra(buf.clone());
                writer.add_entry(4, &image).unwrap();
            }
        }
    }

    writer.write().unwrap();
    drop(writer);

    let mut image2 = S25Archive::open("../test/susuko.s25").unwrap();
    for i in 0..image.total_entries() {
        let meta1 = image.load_image(i);
        let meta2 = image2.load_image(i);

        if let (Ok(mut meta1), Ok(mut meta2)) = (meta1, meta2) {
            meta1.metadata.head = 0;
            meta2.metadata.head = 0;

            assert_eq!(meta1.metadata, meta2.metadata, "metadata wrong at: {}", i);
            assert_eq!(
                meta1.rgba_buffer, meta2.rgba_buffer,
                "decode wrong at: {}",
                i
            );
        }
    }
}
