from io import BytesIO
from pathlib import Path
from urllib.request import urlopen
from PIL import Image, ImageOps

# Reuse the original project photo; only crop to the displayed ratio and compress.
for width in (480, 960, 1440):
    source = Path('public/images') / f'produce-hero-{width}.jpg'
    content = source.read_bytes() if source.exists() else urlopen(f'https://images.pexels.com/photos/33622710/pexels-photo-33622710.jpeg?auto=compress&cs=tinysrgb&w={width}', timeout=30).read()
    with Image.open(BytesIO(content)) as image:
        image = ImageOps.fit(image.convert('RGB'), (width, width * 3 // 4))
        image.save(source.with_suffix('.webp'), 'WEBP', quality=68, method=6)
