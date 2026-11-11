"""Small cPanel frontend update; excludes credentials and database files."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--output', default='family-choice-mobile-update.zip')
parser.add_argument('--seo', action='store_true', help='Include the Google discovery server files')
args = parser.parse_args()
if Path(args.output).name != args.output or not args.output.endswith('.zip'):
    parser.error('--output must be a ZIP filename')

root = Path(__file__).resolve().parents[1]
files = [(root / 'dist/index.html', 'public/index.html')]
files += [(path, 'public/assets/' + path.name) for path in (root / 'dist/assets').glob('*')]
# Include the actual photos to repair incomplete earlier uploads as well as CSS.
files += [(path, 'public/images/hero/' + path.name) for path in (root / 'public/images/hero').glob('*.webp')]
files += [(path, 'public/images/brand/' + path.name) for path in (root / 'public/images/brand').glob('*')]
files += [(path, 'public/fonts/' + path.name) for path in (root / 'public/fonts').glob('*')]
if args.seo:
    server_files = ['app/Http/Controllers/StorefrontController.php', 'config/seo.php', 'resources/seo/site.json', 'resources/views/storefront/head.blade.php', 'resources/views/storefront/content.blade.php', 'routes/web.php', 'public/robots.txt', 'public/.htaccess']
    files += [(root / 'backend' / name, name) for name in server_files]
    files += [(root / 'docs/GOOGLE-DISCOVERY.md', 'GOOGLE-DISCOVERY.md')]
output = root / 'artifacts/hosting' / args.output
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path, target in files:
        item = ZipInfo(target)
        item.create_system = 3
        item.external_attr = 0o100644 << 16
        item.compress_type = ZIP_DEFLATED
        archive.writestr(item, path.read_bytes())
print(f'{output}: {output.stat().st_size:,} bytes, {len(files)} files')
