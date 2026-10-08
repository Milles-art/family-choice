# Hero photo

This is the existing project photograph from Pexels photo 33622710:
https://www.pexels.com/photo/33622710/

The three WebP variants preserve the same photo, cropped to the displayed 4:3 ratio at 480, 960 and 1440 pixels. They use quality 68. The homepage loads these local files with responsive `srcset` and high fetch priority. Supplier/product images have not been replaced.

Regenerate with `scripts/optimize-hero.py` using Python with Pillow. It downloads the original project image when a source JPEG is unavailable.

Hero slideshow: four owner-provided WebP images from Downloads, optimized at 640/1280/1920px for editorial backgrounds. Originals are preserved. Not used as product photographs.
