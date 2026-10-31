import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/lib/config.js';
import { loadCategories } from '../scripts/lib/data.js';

test('add-store form labels match the parser and every category checkbox maps to the taxonomy', () => {
  const form = readFileSync(path.join(ROOT, '.github/ISSUE_TEMPLATE/add-store.yml'), 'utf8');
  for (const label of ['Store website', 'Store name', 'Country', 'Categories', 'What does the store sell?', 'Where does the store deliver?', 'Store pickup', 'Ecommerce platform (if you know it)', 'Your relationship to the store', 'Public pages that confirm this information', 'Anything else useful for finding products on this site']) {
    assert.ok(form.includes(`label: ${label}`), `missing field label: ${label}`);
  }
  const categories = loadCategories().categories;
  const labels = [...form.matchAll(/- label: "([^"]+ \/ [^"]+)"/g)].map((m) => m[1]);
  assert.equal(labels.length, categories.length);
  for (const label of labels) {
    const [en, es] = label.split(' / ');
    assert.ok(categories.some((c) => c.labels.en === en && c.labels.es === es), `checkbox "${label}" is not in the taxonomy`);
  }
});
