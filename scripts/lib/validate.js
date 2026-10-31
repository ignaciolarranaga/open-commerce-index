import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readJson } from './config.js';
import { loadStores, loadCategories, loadCountries, siteHost, today, STORES_DIR } from './data.js';
import { lintText, lintableFields } from './lint.js';

export function createValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return {
    store: ajv.compile(readJson('schemas/store.schema.json')),
    categories: ajv.compile(readJson('schemas/categories.schema.json')),
    index: ajv.compile(readJson('schemas/index.schema.json')),
  };
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || '/'} ${error.message}${error.params?.allowedValues ? ` (${error.params.allowedValues.join(', ')})` : ''}`);
}

/**
 * Validates the taxonomy and every store manifest. Returns { problems, stores, categories }.
 * Each problem is { file, message }. The function never throws on data errors.
 */
export function validateAll({ storesDir = STORES_DIR, validators = createValidators() } = {}) {
  const problems = [];
  const report = (file, message) => problems.push({ file: path.relative(process.cwd(), file), message });

  const categories = loadCategories();
  const categoriesFile = path.join(storesDir, '..', 'categories.json');
  if (!validators.categories(categories)) {
    for (const message of formatAjvErrors(validators.categories.errors)) report(categoriesFile, message);
  }
  const categoryIds = new Set(categories.categories.map((category) => category.id));
  for (const category of categories.categories) {
    if (category.parent && !categoryIds.has(category.parent)) report(categoriesFile, `category ${category.id} has unknown parent ${category.parent}`);
  }
  const countryList = loadCountries().countries;
  const countryCodes = new Set(countryList.map((country) => country.country));
  const regionCodes = new Map(countryList.map((country) => [country.country, new Set((country.regions || []).map((region) => region.code))]));

  const stores = loadStores(storesDir);
  const seenIds = new Map();
  const seenHosts = new Map();
  const todayIso = today();

  for (const store of stores) {
    const file = store.manifestPath;
    if (!store.files.includes('manifest.json')) {
      report(store.dir, 'missing manifest.json');
      continue;
    }
    if (!store.manifest) {
      report(file, `invalid JSON: ${store.parseError}`);
      continue;
    }
    const manifest = store.manifest;
    if (!validators.store(manifest)) {
      for (const message of formatAjvErrors(validators.store.errors)) report(file, message);
    }
    const expectedId = `${store.countryCode}-${store.slug}`;
    if (manifest.id !== expectedId) report(file, `id "${manifest.id}" must match its folder: ${expectedId}`);
    if (manifest.country && manifest.country.toLowerCase() !== store.countryCode) report(file, `country ${manifest.country} does not match folder ${store.countryCode}`);
    if (manifest.country && !countryCodes.has(manifest.country)) report(file, `country ${manifest.country} is not in data/countries.json`);

    if (seenIds.has(manifest.id)) report(file, `duplicate id ${manifest.id} (also in ${seenIds.get(manifest.id)})`);
    seenIds.set(manifest.id, path.relative(process.cwd(), file));
    const host = siteHost(manifest.website);
    if (host) {
      if (seenHosts.has(host)) report(file, `duplicate website host ${host} (also in ${seenHosts.get(host)})`);
      seenHosts.set(host, path.relative(process.cwd(), file));
    }

    (manifest.fulfillment?.ships_to || []).forEach((entry, i) => {
      for (const region of entry.regions || []) {
        if (!region.startsWith(`${entry.country}-`)) report(file, `fulfillment.ships_to[${i}].regions: ${region} is not in ${entry.country}`);
        else if (!regionCodes.get(entry.country)?.has(region)) report(file, `fulfillment.ships_to[${i}].regions: ${region} is not in data/countries.json`);
      }
    });

    for (const category of manifest.categories || []) {
      if (!categoryIds.has(category)) report(file, `unknown category "${category}"`);
    }
    if (manifest.taxonomy_version && manifest.taxonomy_version > categories.taxonomy_version) {
      report(file, `taxonomy_version ${manifest.taxonomy_version} is newer than data/categories.json (${categories.taxonomy_version})`);
    }

    for (const [where, value] of dateFields(manifest)) {
      if (value > todayIso) report(file, `${where} is in the future (${value})`);
      if (Number.isNaN(Date.parse(value))) report(file, `${where} is not a real date (${value})`);
    }

    for (const [where, value] of lintableFields(manifest)) {
      for (const reason of lintText(value)) report(file, `${where}: ${reason}`);
    }

    const template = manifest.access?.search?.url_template;
    if (template && siteHost(template.replace('{query}', 'x')) !== host) report(file, 'access.search.url_template must be on the store website host');
    for (const [i, endpoint] of (manifest.access?.endpoints || []).entries()) {
      if (siteHost(endpoint.url) !== host) report(file, `access.endpoints[${i}].url must be on the store website host`);
    }

    const extraFiles = store.files.filter((name) => !['manifest.json', 'README.md'].includes(name));
    if (extraFiles.length) report(store.dir, `unexpected files: ${extraFiles.join(', ')} (only manifest.json and the generated README.md belong here)`);

    for (const key of ['price', 'prices', 'inventory', 'stock', 'catalog', 'products', 'api_key', 'token', 'password']) {
      if (key in manifest) report(file, `field "${key}" is not allowed in a manifest`);
    }
  }
  return { problems, stores, categories };
}

function dateFields(manifest) {
  const fields = [];
  const push = (where, value) => {
    if (typeof value === 'string') fields.push([where, value]);
  };
  push('access.last_checked', manifest.access?.last_checked);
  push('provenance.added_on', manifest.provenance?.added_on);
  push('provenance.reviewed_on', manifest.provenance?.reviewed_on);
  push('verification.last_review', manifest.verification?.last_review);
  (manifest.provenance?.sources || []).forEach((source, i) => push(`provenance.sources[${i}].accessed_on`, source.accessed_on));
  return fields;
}
