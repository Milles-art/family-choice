"""Preserve supplied originals and create responsive editorial WebP assets."""
from pathlib import Path
from shutil import copy2
import json
import argparse
from PIL import Image, ImageOps

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path, help='Folder containing the 21 supplied original images')
args = parser.parse_args()
source = args.source
backup = Path('artifacts/image-originals')
target = Path('public/images/editorial')
backup.mkdir(parents=True, exist_ok=True)
target.mkdir(parents=True, exist_ok=True)
images = {
    'category-fruits-vegetables': 'Fresh produce in a market basket-1.webp',
    'category-meat-poultry': 'Raw chicken breasts on stainless steel tray-2.webp',
    'category-dairy-eggs': 'Milk, eggs, and cheese in soft daylight-3.webp',
    'category-frozen-foods': 'Frozen peas and vanilla ice cream-4.webp',
    'category-bakery': 'Brown Bread and Rolls on Linen-5.webp',
    'category-pantry-staples': 'Rice, beans, and lentils-6.webp',
    'promotion-pantry-essentials': 'Rice, Beans, Flour, and Oil-7.webp',
    'category-household-essentials': 'Cleaning Supplies on a White Counter-8.webp',
    'category-beverages': 'Orange juice, water, and hibiscus drinks-9.webp',
    'about-store-exterior-concept': 'Modest Tanzania Neighborhood Supermarket-10.webp',
    'promotion-weekly-shopping': 'Overhead bag of bread, eggs, and fruit-11.webp',
    'about-team-produce-concept': 'Family Choice staff arranging fresh produce-12.webp',
    'about-store-interior-concept': 'Clean Tanzanian supermarket interior-13.webp',
    'promotion-fresh-produce': 'Fresh produce packed with care-14.webp',
    'delivery-home-handover-concept': 'Friendly Grocery Delivery at Home-15.webp',
    'community-food-box': 'Cardboard box of everyday pantry staples-16.webp',
    'community-volunteers-packing-concept': 'Volunteers Packing Groceries Together-17.webp',
    'community-surplus-sorting-concept': 'Hands sorting fresh produce-18.webp',
    'recipe-beef-pepper-stir-fry': 'Beef and bell pepper stir-fry-19.webp',
    'recipe-eggs-toast-tomato': 'Everyday breakfast_ eggs, toast, and tomato-20.webp',
    'recipe-tropical-fruit-dessert': 'Fresh Tropical Fruit Bowl-21.webp',
}
manifest = []
for name, original in images.items():
    path = source / original
    copy2(path, backup / original)
    with Image.open(path) as raw:
        image = ImageOps.exif_transpose(raw).convert('RGB')
        widths = (320, 640, 960) if name.startswith('category-') else (480, 960, 1440)
        variants = []
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            output = target / f'{name}-{width}.webp'
            resized.save(output, 'WEBP', quality=78, method=6)
            variants.append({'file': output.name, 'width': width, 'height': height, 'bytes': output.stat().st_size})
        manifest.append({'name': name, 'original': original, 'source_bytes': path.stat().st_size, 'variants': variants})
(target / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print(f'Prepared {len(manifest)} images; originals preserved in {backup}')
