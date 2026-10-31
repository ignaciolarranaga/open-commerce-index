import test from 'node:test';
import assert from 'node:assert/strict';
import { isNationwide, storeCities } from '../scripts/lib/shards.js';
import { validManifest } from './helpers.js';

test('a store with no city list is nationwide and names no cities', () => {
  const manifest = validManifest();
  assert.equal(isNationwide(manifest), true);
  assert.deepEqual([...storeCities(manifest)], []);
});

test('a home city alone names the city and keeps the store nationwide', () => {
  const manifest = validManifest({ city: 'montevideo' });
  assert.equal(isNationwide(manifest), true);
  assert.deepEqual([...storeCities(manifest)], ['montevideo']);
});

test('ships_to city lists name those cities and leave the store out of nationwide', () => {
  const manifest = validManifest();
  manifest.fulfillment.ships_to = [{ country: 'UY', coverage: 'partial', cities: ['montevideo', 'canelones'] }];
  assert.equal(isNationwide(manifest), false);
  assert.deepEqual([...storeCities(manifest)].sort(), ['canelones', 'montevideo']);
});

test('a store with one unrestricted entry and one city entry is nationwide', () => {
  const manifest = validManifest();
  manifest.fulfillment.ships_to = [
    { country: 'UY', coverage: 'partial', cities: ['maldonado'] },
    { country: 'UY', coverage: 'confirmed' },
  ];
  assert.equal(isNationwide(manifest), true);
});

test('entries for other countries do not restrict the home country', () => {
  const manifest = validManifest();
  manifest.fulfillment.ships_to = [{ country: 'AR', coverage: 'confirmed', cities: ['buenos-aires'] }];
  assert.equal(isNationwide(manifest), true);
  assert.deepEqual([...storeCities(manifest)], []);
});
