"""Stage or archive a credential-free cPanel release; never copy the local database."""
import argparse, datetime, hashlib, json, shutil, zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--stage', action='store_true')
parser.add_argument('--archive', type=Path)
args = parser.parse_args()

if args.stage:
    release = root / 'artifacts/hosting' / datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    app = release / 'family-choice/backend'
    app.mkdir(parents=True, exist_ok=False)
    for directory in ['app', 'config', 'routes', 'resources']:
        shutil.copytree(root/'backend'/directory, app/directory)
    for directory in ['migrations', 'factories', 'seeders', 'catalog']:
        shutil.copytree(root/'backend/database'/directory, app/'database'/directory)
    for name in ['artisan', 'composer.json', 'composer.lock', '.env.production.example']:
        shutil.copy2(root/'backend'/name, app/name)
    template = (app/'.env.production.example').read_text(encoding='utf-8')
    template = template.replace('DB_HOST=\n','DB_HOST=localhost\n').replace('DB_DATABASE=\n','DB_DATABASE=afyabgzo_familychoice\n').replace('DB_USERNAME=\n','DB_USERNAME=afyabgzo_familychoice\n')
    (app/'.env.cpanel.example').write_text(template,encoding='utf-8')
    (app/'bootstrap').mkdir()
    for path in (root/'backend/bootstrap').glob('*.php'): shutil.copy2(path, app/'bootstrap'/path.name)
    for directory in ['bootstrap/cache', 'storage/app/private', 'storage/app/public', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs']:
        (app/directory).mkdir(parents=True, exist_ok=True)
    shutil.copytree(root/'dist', app/'public')
    for name in ['index.php', '.htaccess', 'favicon.ico', 'robots.txt']:
        shutil.copy2(root/'backend/public'/name, app/'public'/name)
    shutil.copy2(root/'docs/CPANEL-LAUNCH.md', release/'family-choice/CPANEL-LAUNCH.md')
    (release/'RELEASE.json').write_text(json.dumps({'application':'FAMILY CHOICE SUPERMARKET','domain':'familychoiceminimarket.co.tz','products':247,'stock':'owner-confirmed availability; counts unspecified','environment':'configure privately on host','database':'not bundled'},indent=2),encoding='utf-8')
    print(str(release))
elif args.archive:
    release = args.archive.resolve()
    allowed = (root/'artifacts/hosting').resolve()
    if not release.is_relative_to(allowed): raise ValueError('Stage must be inside artifacts/hosting')
    files = sorted(p for p in release.rglob('*') if p.is_file())
    forbidden_names = {'.env', '.env.local', '.env.backup', 'auth.json', 'database.sqlite', 'database.sqlite-wal', 'database.sqlite-shm'}
    for path in files:
        if path.name in forbidden_names or path.suffix.lower() in {'.log','.sql','.sqlite','.pem','.key'}: raise ValueError('Private/local file in release: '+str(path.relative_to(release)))
    if not (release/'family-choice/backend/vendor/autoload.php').is_file(): raise ValueError('Production vendor missing')
    installed = json.loads((release/'family-choice/backend/vendor/composer/installed.json').read_text(encoding='utf-8'))
    if installed.get('dev') or any(p['name'] in {'phpunit/phpunit','fakerphp/faker','laravel/pail','laravel/sail','laravel/pint','mockery/mockery','nunomaduro/collision'} for p in installed['packages']): raise ValueError('Development dependencies in release')
    app = release/'family-choice/backend'
    products = json.loads((app/'database/catalog/family-choice-products.json').read_text(encoding='utf-8'))
    assert len(products)==247 and all((app/'public'/p['image'].lstrip('/')).is_file() for p in products)
    manifest = {str(p.relative_to(release)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    (release/'MANIFEST.sha256.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    archive = release.parent/f'family-choice-cpanel-{release.name}.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as bundle:
        for path in sorted(release.rglob('*')):
            info = zipfile.ZipInfo.from_file(path,path.relative_to(release))
            info.create_system = 3
            info.external_attr = (0o40755 if path.is_dir() else 0o100644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(info,b'' if path.is_dir() else path.read_bytes())
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert not any(name.endswith('/.env') or '.sqlite' in name or name.endswith('.sql') for name in bundle.namelist())
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(checksum+'  '+archive.name+'\n')
    print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(manifest),'sha256':checksum,'products':len(products),'production_dependencies':len(installed['packages'])},indent=2))
else: parser.error('Specify --stage or --archive STAGE')
