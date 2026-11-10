"""Back up the five supplied homepage photographs and optimize responsive WebP files."""
from pathlib import Path
from shutil import copy2
from PIL import Image

source = Path('C:/Users/DIGITAL STAR/Downloads')
backup = Path('artifacts/home-reference-originals')
target = Path('public/images/home-reference')
backup.mkdir(parents=True, exist_ok=True)
target.mkdir(parents=True, exist_ok=True)
photos = {'fresh-produce-basket':'Fresh produce basket.png', 'bakery-counter':'Bakery counter.png', 'pantry-staples':'Pantry staples.png', 'home-delivery':'Home delivery.png', 'family-shopping':'Family shopping.png'}
for name, original in photos.items():
    copy2(source / original, backup / original)
    with Image.open(source / original) as image:
        image = image.convert('RGB')
        for width in (640, 960, 1344):
            image.resize((width, round(width * image.height / image.width)), Image.Resampling.LANCZOS).save(target / f'{name}-{width}.webp', quality=82, method=6)
    print(f'Prepared {name}')
