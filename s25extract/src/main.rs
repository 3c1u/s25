#![warn(clippy::all)]

#[macro_use]
extern crate clap;

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
    )
    .get_matches();

    let input = Path::new(matches.value_of("INPUT").unwrap());
    let output = Path::new(matches.value_of("OUTPUT").unwrap());

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
            writer.write_image_data(&img.rgba_buffer).unwrap();
        }
    }
}
