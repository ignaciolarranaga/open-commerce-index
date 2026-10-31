import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadConfig } from '../scripts/lib/config.js';
import { createValidators } from '../scripts/lib/validate.js';

const config = loadConfig();
const dist = path.join(ROOT, 'dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
}

test('build runs and the root index validates', () => {
  execSync('node scripts/build.js', { cwd: ROOT, stdio: 'pipe' });
  const index = JSON.parse(readFileSync(path.join(dist, 'index.json'), 'utf8'));
  assert.equal(createValidators().index(index), true);
  assert.ok(index.countries.find((c) => c.country === 'UY').store_count >= 3);
  assert.ok(existsSync(path.join(dist, '.nojekyll')));
  const uy = JSON.parse(readFileSync(path.join(dist, 'uy.json'), 'utf8'));
  assert.ok(uy.stores.every((s) => s._links.json.startsWith(config.baseUrl)));
});

test('every internal link and asset resolves and no block markers leak', () => {
  const pages = walk(dist).filter((file) => file.endsWith('.html'));
  assert.ok(pages.length > 40);
  const missing = [];
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    assert.ok(!html.includes(':::'), `block marker left in ${page}`);
    assert.match(html, /<html lang="(es|en)">/);
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      let target = href.startsWith(config.basePath) ? href.slice(config.basePath.length) : path.relative(dist, path.resolve(path.dirname(page), href));
      target = target.split('#')[0].split('?')[0];
      let file = path.join(dist, target);
      if (target.endsWith('/') || target === '') file = path.join(file, 'index.html');
      if (!existsSync(file)) missing.push(`${path.relative(dist, page)} -> ${href}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('store READMEs are in sync with manifests (--check)', () => {
  execSync('node scripts/build.js --check', { cwd: ROOT, stdio: 'pipe' });
});

test('core content renders without JavaScript', () => {
  const html = readFileSync(path.join(dist, 'es', 'directory', 'uy', 'stores', 'zonatecno', 'index.html'), 'utf8');
  assert.ok(!/<script/i.test(html));
  assert.match(html, /ZonaTecno/);
  assert.match(html, /catalogo\?q=\{query\}/);
});
