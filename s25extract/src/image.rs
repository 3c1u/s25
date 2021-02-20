use super::utils;

#[derive(Clone)]
pub struct Image {
    pub width: usize,
    pub height: usize,
    pub rgba_buffer: Vec<u8>,
}

#[derive(Copy, Clone)]
pub struct ImageSlice<'a> {
    pub width: usize,
    pub height: usize,
    pub rgba_buffer: &'a [u8],
}

pub struct ImageSliceMut<'a> {
    pub width: usize,
    pub height: usize,
    pub rgba_buffer: &'a mut [u8],
}

pub trait ImageView {
    fn get(&self, x: usize, y: usize) -> Option<&[u8]>;
    fn get_width(&self) -> usize;
    fn get_height(&self) -> usize;
}

pub trait ImageViewMut: ImageView {
    fn get_mut(&mut self, x: usize, y: usize) -> Option<&mut [u8]>;
}

impl ImageView for Image {
    fn get(&self, x: usize, y: usize) -> Option<&[u8]> {
        if x < self.width && y < self.height {
            Some(&self.rgba_buffer[(x + y * self.width) << 2..][0..4])
        } else {
            None
        }
    }

    fn get_width(&self) -> usize {
        self.width
    }

    fn get_height(&self) -> usize {
        self.height
    }
}

impl ImageViewMut for Image {
    fn get_mut(&mut self, x: usize, y: usize) -> Option<&mut [u8]> {
        if x < self.width && y < self.height {
            Some(&mut self.rgba_buffer[(x + y * self.width) << 2..][..4])
        } else {
            None
        }
    }
}

impl<'a> ImageView for ImageSlice<'a> {
    fn get(&self, x: usize, y: usize) -> Option<&[u8]> {
        if x < self.width && y < self.height {
            Some(&self.rgba_buffer[(x + y * self.width) << 2..][..4])
        } else {
            None
        }
    }

    fn get_width(&self) -> usize {
        self.width
    }

    fn get_height(&self) -> usize {
        self.height
    }
}

impl<'a> ImageView for ImageSliceMut<'a> {
    fn get(&self, x: usize, y: usize) -> Option<&[u8]> {
        if x < self.width && y < self.height {
            Some(&self.rgba_buffer[(x + y * self.width) << 2..][..4])
        } else {
            None
        }
    }

    fn get_width(&self) -> usize {
        self.width
    }

    fn get_height(&self) -> usize {
        self.height
    }
}

impl<'a> ImageViewMut for ImageSliceMut<'a> {
    fn get_mut(&mut self, x: usize, y: usize) -> Option<&mut [u8]> {
        if x < self.width && y < self.height {
            Some(&mut self.rgba_buffer[(x + y * self.width) << 2..][..4])
        } else {
            None
        }
    }
}

use std::ops::Deref;

impl<'a> ImageSlice<'a> {
    pub fn to_image(&self) -> Image {
        Image {
            width: self.width,
            height: self.height,
            rgba_buffer: self.rgba_buffer.into(),
        }
    }
}

impl<'a> Deref for ImageSliceMut<'a> {
    type Target = ImageSlice<'a>;

    fn deref(&self) -> &Self::Target {
        unsafe { std::mem::transmute(&self) }
    }
}

use s25::S25Image;

impl From<S25Image> for Image {
    fn from(image: S25Image) -> Self {
        let width = image.metadata.width as usize;
        let height = image.metadata.height as usize;

        let rgba_buffer = image.rgba_buffer().iter().copied().collect();

        Self {
            width,
            height,
            rgba_buffer,
        }
    }
}

impl Image {
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            width,
            height,
            rgba_buffer: vec![0; width * height * 4],
        }
    }

    pub fn clear(&mut self) {
        crate::utils::memset(&mut self.rgba_buffer, 0x00);
    }

    pub fn draw_image(&mut self, image: &Image, (x, y): (isize, isize)) {
        self.draw_image_buffer(&image.rgba_buffer, (x, y), (image.width, image.height));
    }

    pub fn draw_image_buffer(
        &mut self,
        buffer: &[u8],
        (x, y): (isize, isize),
        (width, height): (usize, usize),
    ) {
        let src_img = ImageSlice {
            width,
            height,
            rgba_buffer: buffer,
        };

        let mut dest_img = ImageSliceMut {
            width: self.width,
            height: self.height,
            rgba_buffer: &mut self.rgba_buffer,
        };

        utils::alpha_blend(&src_img, &mut dest_img, (x, y), 1.0);
    }
}
