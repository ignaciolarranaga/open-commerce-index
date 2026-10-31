import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT } from '../scripts/lib/config.js';

/** A valid manifest to mutate in tests. Mirrors data/stores/uy/zonatecno but with a fake host. */
export function validManifest(overrides = {}) {
  return {
    schema_version: 1,
    id: 'uy-example-store',
    name: 'Example Store',
    website: 'https://www.example-store.com.uy/',
    description: 'Example retailer of appliances and computers used only by the automated tests of this repository.',
    country: 'UY',
    languages: ['es'],
    currencies: ['UYU', 'USD'],
    categories: ['appliances', 'computing'],
    taxonomy_version: 1,
    fulfillment: { ships_to: [{ country: 'UY', coverage: 'confirmed' }], pickup: 'unknown' },
    access: {
      platform: 'fenicio',
      rendering: 'server',
      bot_protection: 'none',
      robots: { generic: 'allowed', ai_user_agents: 'allowed' },
      search: { url_template: 'https://www.example-store.com.uy/catalogo?q={query}', status: 'verified' },
      endpoints: [],
      last_checked: '2026-10-31',
    },
    shopping_notes: 'Prices are shown in US dollars for electronics and in pesos for the rest.',
    provenance: { origin: 'editorial', sources: [{ url: 'https://www.example-store.com.uy/', supports: 'store exists', accessed_on: '2026-10-31' }], added_on: '2026-10-31' },
    verification: { domain_ownership: 'unverified', technical_access: 'unverified', last_review: null },
    ...overrides,
  };
}

/** Writes manifests into a temporary stores dir: { 'uy/example-store': manifest, ... } */
export function tempStores(manifests) {
  const dir = mkdtempSync(path.join(tmpdir(), 'oci-stores-'));
  for (const [relative, manifest] of Object.entries(manifests)) {
    const storeDir = path.join(dir, relative);
    mkdirSync(storeDir, { recursive: true });
    writeFileSync(path.join(storeDir, 'manifest.json'), typeof manifest === 'string' ? manifest : JSON.stringify(manifest, null, 2));
  }
  return dir;
}

/** Copies the real data/stores tree into a temp dir so tests can mutate it. */
export function copyRealStores() {
  const dir = mkdtempSync(path.join(tmpdir(), 'oci-real-'));
  cpSync(path.join(ROOT, 'data', 'stores'), dir, { recursive: true });
  return dir;
}
