#!/usr/bin/env node
/**
 * Scaffolds a store manifest from a probe report plus editorial fields.
 *
 *   node scripts/probe.js https://www.example.com.uy -q cafetera > /tmp/probe.json
 *   node scripts/new-store.js --probe /tmp/probe.json --name "Example" --country UY \
 *     --categories appliances,small-appliances --description "..." \
 *     --source "https://www.example.com.uy/envios|shipping coverage" [--ships-to UY:confirmed] [--regions UY-MO,UY-CA] [--pickup yes]
 *
 * Writes data/stores/<cc>/<slug>/manifest.json (refusing to overwrite unless --force) and prints its path.
 * Verification fields are always written as unverified: only maintainers change them, by hand, in review.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readJson } from './lib/config.js';
import { STORES_DIR, slugify, today, loadCountries } from './lib/data.js';

const { values } = parseArgs({
  options: {
    probe: { type: 'string' },
    name: { type: 'string' },
    country: { type: 'string' },
    slug: { type: 'string' },
    categories: { type: 'string' },
    description: { type: 'string' },
    'description-es': { type: 'string' },
    languages: { type: 'string' },
    currencies: { type: 'string' },
    brands: { type: 'string' },
    'ships-to': { type: 'string', multiple: true },
    regions: { type: 'string' },
    pickup: { type: 'string', default: 'unknown' },
    'pickup-notes': { type: 'string' },
    notes: { type: 'string' },
    source: { type: 'string', multiple: true },
    origin: { type: 'string', default: 'editorial' },
    issue: { type: 'string' },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log('See the header comment in scripts/new-store.js for usage.');
  process.exit(0);
}
for (const required of ['probe', 'name', 'country', 'categories', 'description']) {
  if (!values[required]) {
    console.error(`--${required} is required`);
    process.exit(2);
  }
}

const probe = readJson(values.probe);
const country = values.country.toUpperCase();
const countryInfo = loadCountries().countries.find((entry) => entry.country === country);
if (!countryInfo) {
  console.error(`country ${country} is not in data/countries.json; add it first`);
  process.exit(2);
}
const slug = values.slug || slugify(values.name);
const website = new URL(probe.final_url || probe.input_url).origin + '/';
const split = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
const date = today();

const sources = (values.source || []).map((entry) => {
  const [url, supports] = entry.split('|');
  return { url: url.trim(), supports: (supports || 'store website').trim(), accessed_on: date };
});
if (!sources.length) sources.push({ url: website, supports: 'store exists, name, what it sells', accessed_on: date });

const shipsTo = (values['ships-to'] || []).map((entry) => {
  const [code, coverage = 'unknown', notes] = entry.split(':');
  return { country: code.toUpperCase(), coverage, ...(notes ? { notes } : {}) };
});
if (!shipsTo.length) shipsTo.push({ country, coverage: 'unknown' });
// --regions lists ISO 3166-2 codes; each goes on the ships_to entry of its country.
for (const region of split(values.regions)) {
  const entry = shipsTo.find((item) => region.toUpperCase().startsWith(`${item.country}-`));
  if (!entry) {
    console.error(`region ${region} has no matching --ships-to country`);
    process.exit(2);
  }
  entry.regions = [...(entry.regions || []), region.toUpperCase()];
}

const manifest = {
  schema_version: 1,
  id: `${country.toLowerCase()}-${slug}`,
  name: values.name,
  website,
  description: values.description,
  ...(values['description-es'] ? { description_es: values['description-es'] } : {}),
  country,
  languages: split(values.languages).length ? split(values.languages) : [probe.language_hint || countryInfo.languages[0]].filter(Boolean),
  currencies: split(values.currencies).length ? split(values.currencies) : (probe.currency_hints?.length ? probe.currency_hints : countryInfo.currencies),
  categories: split(values.categories),
  taxonomy_version: readJson('data/categories.json').taxonomy_version,
  ...(split(values.brands).length ? { brands: split(values.brands) } : {}),
  fulfillment: { ships_to: shipsTo, pickup: values.pickup, ...(values['pickup-notes'] ? { pickup_notes: values['pickup-notes'] } : {}) },
  access: probe.manifest_access,
  ...(values.notes ? { shopping_notes: values.notes } : {}),
  provenance: { origin: values.origin, sources, ...(values.issue ? { issue: Number(values.issue) } : {}), added_on: date },
  verification: { domain_ownership: 'unverified', technical_access: 'unverified', last_review: null },
};

const dir = path.join(STORES_DIR, country.toLowerCase(), slug);
const file = path.join(dir, 'manifest.json');
if (existsSync(file) && !values.force) {
  console.error(`${path.relative(process.cwd(), file)} already exists; pass --force to overwrite`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(path.relative(process.cwd(), file));
