import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, searchTemplatesFromForms, searchCandidates, fillTemplate, visibleText, countTerm, detectBotProtection, currencyHints } from '../scripts/lib/platform.js';

test('platform fingerprints', () => {
  assert.equal(detectPlatform('<script src="https://cdn.shopify.com/x.js"></script>').platform, 'shopify');
  assert.equal(detectPlatform('<img src="https://tataio.vtexassets.com/a.png">', { 'x-vtex-io-cluster-id': 'x' }).platform, 'vtex');
  assert.equal(detectPlatform('<link href="/static/version1700/frontend/Vendor/theme/es_ES/css.css">').platform, 'magento');
  assert.equal(detectPlatform('<html><body>plain</body></html>').platform, 'unknown');
});

test('search templates are read from GET forms with a search input', () => {
  const html = '<form action="/catalogo"><input type="search" name="q"></form><form method="post" action="/login"><input name="q"></form>';
  assert.deepEqual(searchTemplatesFromForms(html, 'https://shop.example'), ['https://shop.example/catalogo?q={query}']);
  const candidates = searchCandidates('fenicio', 'https://shop.example', html);
  assert.equal(candidates[0], 'https://shop.example/catalogo?q={query}');
  assert.equal(new Set(candidates).size, candidates.length);
});

test('template filling encodes the query', () => {
  assert.equal(fillTemplate('https://s.example/busca?q={query}&x={query}', 'latte go 5500'), 'https://s.example/busca?q=latte%20go%205500&x=latte%20go%205500');
});

test('visible text and accent-insensitive counting', () => {
  const text = visibleText('<html><script>var a="cafetera"</script><p>Cafetera Philips &amp; café</p><div>CAFETERA</div></html>');
  assert.equal(text, 'Cafetera Philips & café CAFETERA');
  assert.equal(countTerm('Café cafe CAFÉ', 'cafe'), 3);
});

test('bot protection and currency hints', () => {
  assert.equal(detectBotProtection({ status: 403, text: 'Just a moment...', headers: {} }), 'challenge');
  assert.equal(detectBotProtection({ status: 403, text: 'forbidden', headers: {} }), 'blocked');
  assert.equal(detectBotProtection({ status: 200, text: 'ok', headers: {} }), 'none');
  assert.deepEqual(currencyHints('Precio U$S 977 o $U 43.160').sort(), ['USD', 'UYU']);
});
