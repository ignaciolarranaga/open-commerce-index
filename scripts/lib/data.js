import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './config.js';

export const STORES_DIR = path.join(ROOT, 'data', 'stores');

export function loadCategories() {
  return readJson('data/categories.json');
}

export function loadCountries() {
  return readJson('data/countries.json');
}

/** Every store folder as { countryCode, slug, dir, manifestPath, files }. */
export function listStoreDirs(storesDir = STORES_DIR) {
  if (!existsSync(storesDir)) return [];
  const result = [];
  for (const countryCode of readdirSync(storesDir).sort()) {
    const countryDir = path.join(storesDir, countryCode);
    if (!statSync(countryDir).isDirectory()) continue;
    for (const slug of readdirSync(countryDir).sort()) {
      const dir = path.join(countryDir, slug);
      if (!statSync(dir).isDirectory()) continue;
      result.push({ countryCode, slug, dir, manifestPath: path.join(dir, 'manifest.json'), files: readdirSync(dir).sort() });
    }
  }
  return result;
}

/** Loads every manifest. Parse failures are returned instead of thrown so the validator can report them. */
export function loadStores(storesDir = STORES_DIR) {
  return listStoreDirs(storesDir).map((entry) => {
    try {
      return { ...entry, manifest: JSON.parse(readFileSync(entry.manifestPath, 'utf8')) };
    } catch (error) {
      return { ...entry, manifest: null, parseError: error.message };
    }
  });
}

/** Hostname without a leading www., lowercased. */
export function siteHost(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
