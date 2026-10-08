import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
if (!existsSync('dist/index.html')) throw new Error('Run npm run build first.');
const destination = process.env.LARAVEL_PUBLIC_DIR || 'backend/public';
mkdirSync(destination, { recursive: true });
const assetsDirectory = resolve(destination, 'assets');
const previousAssets = new Set();
// Retain the preceding build and its imported chunks for already-open tabs.
function collectPreviousAssets(file) {
  if (!existsSync(file)) return;
  for (const name of readFileSync(file, 'utf8').match(/\bindex-[A-Za-z0-9_-]+\.(?:js|css)\b/g) ?? []) {
    if (previousAssets.has(name)) continue;
    previousAssets.add(name);
    collectPreviousAssets(join(assetsDirectory, name));
  }
}
collectPreviousAssets(join(destination, 'index.html'));
cpSync('dist/index.html', `${destination}/index.html`);
cpSync('dist/assets', `${destination}/assets`, {recursive:true});
const currentAssets = new Set(readdirSync('dist/assets'));
let removed = 0;
for (const name of readdirSync(assetsDirectory)) {
  if (!/^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name) || currentAssets.has(name) || previousAssets.has(name)) continue;
  const file = resolve(assetsDirectory, name);
  if (!file.startsWith(`${assetsDirectory}${sep}`) || basename(file) !== name) throw new Error('Invalid generated asset path.');
  unlinkSync(file);
  removed++;
}
if (existsSync('dist/images')) cpSync('dist/images', `${destination}/images`, {recursive:true});
if (existsSync('dist/fonts')) cpSync('dist/fonts', `${destination}/fonts`, {recursive:true});
console.log(`Storefront copied to Laravel public directory. Removed ${removed} obsolete build assets.`);
