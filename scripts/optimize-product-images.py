"""Build complete, uncropped responsive WebP copies; preserve supplied originals."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
images = root / 'public/images/products'
sources = sorted(images.glob('*.webp'))
if len(sources) != 247:
    raise RuntimeError(f'Expected 247 canonical photos, found {len(sources)}')
totals = {'original_bytes': 0, 'card_bytes': 0, 'detail_bytes': 0, 'products': len(sources)}
for source in sources:
    totals['original_bytes'] += source.stat().st_size
    with Image.open(source) as original:
        for width, key in [(480, 'card_bytes'), (960, 'detail_bytes')]:
            target = images / 'responsive' / str(width) / source.name
            target.parent.mkdir(parents=True, exist_ok=True)
            # Exact srcset widths; preserve aspect ratio and every packaging edge.
            height = max(1, round(original.height * width / original.width))
            resized = original.convert('RGB').resize((width, height), Image.Resampling.LANCZOS)
            resized.save(target, 'WEBP', quality=78, method=6)
            totals[key] += target.stat().st_size
            with Image.open(target) as check:
                assert check.size == (width, height)
print(json.dumps(totals, indent=2))
