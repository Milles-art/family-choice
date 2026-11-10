"""Package only the files required for the storefront performance update."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import json
import argparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--branding', action='store_true')
args = parser.parse_args()
files = [root / 'backend/app/Http/Controllers/StoreController.php', root / 'backend/public/.htaccess', root / 'backend/public/index.html']
if args.branding:
    files.append(root / 'backend/config/store.php')
    files += sorted((root / 'public/images/brand').glob('*'))
files += sorted((root / 'dist/assets').glob('*'))
files += sorted((root / 'public/images/products/responsive').glob('*/*.webp'))
assert len(list((root / 'public/images/products/responsive/480').glob('*.webp'))) == 247
assert len(list((root / 'public/images/products/responsive/960').glob('*.webp'))) == 247
output = root / 'artifacts/hosting' / ('family-choice-branding-checkout-update.zip' if args.branding else 'family-choice-performance-patch.zip')
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file in files:
        relative = file.relative_to(root).as_posix()
        if relative.startswith('backend/'):
            target = relative.removeprefix('backend/')
        elif relative.startswith('dist/assets/'):
            target = 'public/assets/' + file.name
        else:
            target = relative
        item = ZipInfo(target)
        item.create_system = 3
        item.external_attr = 0o100644 << 16
        item.compress_type = ZIP_DEFLATED
        archive.writestr(item, file.read_bytes())
print(json.dumps({'archive': str(output), 'bytes': output.stat().st_size, 'files': len(files)}, indent=2))
