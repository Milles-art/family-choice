import { cpSync, existsSync, rmSync } from 'node:fs';
if (!existsSync('dist/index.html')) throw new Error('Run npm run build first.');
cpSync('dist/index.html', 'backend/public/index.html');
rmSync('backend/public/assets', {recursive:true,force:true});
cpSync('dist/assets', 'backend/public/assets', {recursive:true});
console.log('Storefront copied to Laravel public directory.');
