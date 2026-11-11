import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';

test('build copy retains imported previous chunks and removes only obsolete bundles', () => {
  const workspace = resolve('.');
  const testRoot = mkdtempSync(join(workspace, 'artifacts', 'build-copy-test-'));
  const destination = join(testRoot, 'served');
  const write = (file, content) => {
    mkdirSync(resolve(file, '..'), { recursive: true });
    writeFileSync(file, content);
  };
  try {
    write(join(destination, 'index.html'), '<script src="/assets/index-old.js"></script>');
    write(join(destination, 'assets/index-old.js'), 'import("./index-old-chunk.js");');
    write(join(destination, 'assets/index-old-chunk.js'), 'export const old = true;');
    write(join(destination, 'assets/index-obsolete.js'), 'old stale bundle');
    write(join(destination, 'assets/custom.svg'), '<svg/>');
    write(join(testRoot, 'dist/index.html'), '<script src="/assets/index-current.js"></script>');
    write(join(testRoot, 'dist/assets/index-current.js'), 'current application');
    write(join(testRoot, 'dist/fonts/example.woff2'), 'font fixture');
    write(join(testRoot, 'dist/images/example.webp'), 'image fixture');
    execFileSync(process.execPath, [join(workspace, 'scripts/build-backend.mjs')], {
      cwd: testRoot,
      env: { ...process.env, LARAVEL_PUBLIC_DIR: destination },
    });
    for (const name of ['index-old.js', 'index-old-chunk.js', 'index-current.js', 'custom.svg']) {
      assert.ok(existsSync(join(destination, 'assets', name)), `${name} retained`);
    }
    assert.ok(!existsSync(join(destination, 'assets/index-obsolete.js')));
    assert.equal(readFileSync(join(destination, 'fonts/example.woff2'), 'utf8'), 'font fixture');
    assert.equal(readFileSync(join(destination, 'images/example.webp'), 'utf8'), 'image fixture');
    assert.match(readFileSync(join(destination, 'index.html'), 'utf8'), /index-current\.js/);
  } finally {
    const resolvedRoot = resolve(testRoot);
    if (!resolvedRoot.startsWith(`${join(workspace, 'artifacts')}${sep}`)) throw new Error('Test cleanup outside artifacts');
    rmSync(resolvedRoot, { recursive: true, force: true });
  }
});
