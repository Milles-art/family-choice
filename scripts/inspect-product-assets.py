"""Read supplied CSV/WebPs and generate local visual inspection sheets."""
import csv, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parents[1]
rows = list(csv.DictReader((root / 'PRODUCT IMG/all_250_products_and_prices.csv').open(encoding='utf-8-sig', newline='')))
files = list((root / 'PRODUCT IMG/webp').glob('*.webp'))
output = root / 'artifacts/product-import'
output.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
records = []
for row in rows:
    matches = [p for p in files if p.name.lower().startswith(row['catalogue_id'].lower() + '-')]
    if len(matches) != 1:
        raise ValueError(f"{row['catalogue_id']}: expected one image, got {len(matches)}")
    image = Image.open(matches[0]); image.verify()
    image = Image.open(matches[0])
    records.append({**row, 'file': matches[0].name, 'width': image.width, 'height': image.height, 'sha256': hashlib.sha256(matches[0].read_bytes()).hexdigest()})
for start in range(0, len(records), 25):
    sheet = Image.new('RGB', (1550, 1400), '#e5e7eb')
    draw = ImageDraw.Draw(sheet)
    for offset, record in enumerate(records[start:start+25]):
        x, y = (offset % 5) * 310, (offset // 5) * 280
        picture = Image.open(root / 'PRODUCT IMG/webp' / record['file']).convert('RGBA')
        canvas = Image.new('RGBA', picture.size, 'white'); canvas.alpha_composite(picture)
        thumb = ImageOps.contain(canvas.convert('RGB'), (300, 220))
        sheet.paste(thumb, (x + (310-thumb.width)//2, y + (220-thumb.height)//2))
        draw.text((x+5, y+222), record['catalogue_id'] + ' ' + record['product_shown'][:30], font=font, fill='black')
        draw.text((x+5, y+242), record['product_shown'][30:65], font=font, fill='black')
        draw.text((x+5, y+261), 'Original unit: '+record['original_candidate_unit'], font=font, fill='black')
    sheet.save(output / f"sheet-{start//25+1:02}.jpg", quality=92)
(output / 'source-records.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(f'Validated {len(records)} ID matches; generated {len(records)//25} inspection sheets.')
