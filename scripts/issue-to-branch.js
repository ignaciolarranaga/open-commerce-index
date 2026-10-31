#!/usr/bin/env node
/**
 * Turns an "Add a store" Issue Form submission into a draft manifest.
 *
 *   node scripts/issue-to-branch.js --issue issue.json --out manifest-path.txt
 *
 * `issue.json` is `gh issue view <n> --json number,title,body,labels,author`. The body is the
 * Markdown GitHub renders from the form ("### Field heading" followed by the answer). Every
 * value is treated as data: it is parsed, trimmed, length-limited and validated, never executed.
 * The script probes the website (same probe as curation) and writes the manifest with
 * `verification` unverified. The validator runs afterwards in the workflow.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { readJson } from './lib/config.js';
import { STORES_DIR, slugify, today, loadCountries, loadCategories } from './lib/data.js';
import { probe } from './probe.js';

/** Parses GitHub's Issue Form Markdown into { heading: answer }. */
export function parseIssueForm(body) {
  const fields = {};
  const sections = String(body || '').replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const section of sections) {
    const newline = section.indexOf('\n');
    const heading = section.slice(0, newline).trim();
    let answer = section.slice(newline + 1).trim();
    if (answer === '_No response_') answer = '';
    fields[heading] = answer;
  }
  return fields;
}

const FIELD = {
  website: 'Store website',
  name: 'Store name',
  country: 'Country',
  categories: 'Categories',
  description: 'What does the store sell?',
  shipsTo: 'Where does the store deliver?',
  pickup: 'Store pickup',
  platform: 'Ecommerce platform (if you know it)',
  relationship: 'Your relationship to the store',
  sources: 'Public pages that confirm this information',
  notes: 'Anything else useful for finding products on this site',
};

export function manifestFromFields(fields, probeReport, { issueNumber, categories, countries } = {}) {
  const clean = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const website = new URL(probeReport.final_url || probeReport.input_url).origin + '/';
  const name = clean(fields[FIELD.name], 120);
  const countryMatch = clean(fields[FIELD.country], 80).match(/\b([A-Z]{2})\b/);
  const country = countryMatch ? countryMatch[1] : null;
  const countryInfo = countries.find((c) => c.country === country);
  if (!name) throw new Error('missing store name');
  if (!countryInfo) throw new Error(`unknown or unsupported country: ${fields[FIELD.country]}`);
  const labelToId = new Map();
  for (const category of categories.categories) {
    labelToId.set(category.labels.en.toLowerCase(), category.id);
    labelToId.set(category.labels.es.toLowerCase(), category.id);
    labelToId.set(category.id, category.id);
  }
  const selected = String(fields[FIELD.categories] || '')
    .split('\n')
    .map((line) => line.replace(/^- \[[xX ]\]\s*/, '').trim().toLowerCase())
    .filter(Boolean)
    .map((label) => labelToId.get(label.replace(/\s*\(.*\)$/, '')) || null)
    .filter(Boolean);
  const checked = String(fields[FIELD.categories] || '').split('\n').filter((line) => /^- \[[xX]\]/.test(line)).map((line) => line.replace(/^- \[[xX]\]\s*/, '').trim().toLowerCase()).map((label) => labelToId.get(label.replace(/\s*\(.*\)$/, '')) || null).filter(Boolean);
  const categoryIds = [...new Set(checked.length ? checked : selected)].slice(0, 8);
  if (!categoryIds.length) throw new Error('no recognised categories');
  const sourceUrls = [...String(fields[FIELD.sources] || '').matchAll(/https:\/\/[^\s<>"')]+/g)].map((m) => m[0]).filter((url) => url.startsWith(website) || true).slice(0, 10);
  const date = today();
  const pickupAnswer = clean(fields[FIELD.pickup], 40).toLowerCase();
  const pickup = /^(yes|sí|si)/.test(pickupAnswer) ? 'yes' : /^no\b/.test(pickupAnswer) ? 'no' : 'unknown';
  const shipsToText = clean(fields[FIELD.shipsTo], 300);
  const relationship = clean(fields[FIELD.relationship], 80).toLowerCase();
  const origin = /owner|employee|represent|agency/.test(relationship) ? 'owner_submitted' : 'community';
  const description = clean(fields[FIELD.description], 500);
  const notes = clean(fields[FIELD.notes], 600);
  return {
    schema_version: 1,
    id: `${country.toLowerCase()}-${slugify(name)}`,
    name,
    website,
    description: description.length >= 20 ? description : `${name} is an online store in ${countryInfo.names.en}. Details pending editorial review.`,
    country,
    languages: [probeReport.language_hint || countryInfo.languages[0]],
    currencies: probeReport.currency_hints?.length ? probeReport.currency_hints : countryInfo.currencies,
    categories: categoryIds,
    taxonomy_version: categories.taxonomy_version,
    fulfillment: { ships_to: [{ country, coverage: 'unknown', ...(shipsToText ? { notes: shipsToText.slice(0, 300) } : {}) }], pickup },
    access: probeReport.manifest_access,
    ...(notes ? { shopping_notes: notes } : {}),
    provenance: {
      origin,
      sources: [{ url: website, supports: 'store exists (submitted through the add-store form)', accessed_on: date }, ...sourceUrls.map((url) => ({ url, supports: 'submitted by the contributor; to be confirmed in review', accessed_on: date }))],
      ...(issueNumber ? { issue: Number(issueNumber) } : {}),
      added_on: date,
    },
    verification: { domain_ownership: 'unverified', technical_access: 'unverified', last_review: null },
  };
}

async function main() {
  const { values } = parseArgs({ options: { issue: { type: 'string' }, out: { type: 'string' } } });
  if (!values.issue) {
    console.error('usage: node scripts/issue-to-branch.js --issue issue.json [--out manifest-path.txt]');
    process.exit(2);
  }
  const issue = readJson(values.issue);
  const fields = parseIssueForm(issue.body);
  const websiteText = String(fields[FIELD.website] || '').trim();
  const websiteMatch = websiteText.match(/https?:\/\/[^\s<>"']+/);
  if (!websiteMatch) throw new Error('the issue has no https website');
  let website = websiteMatch[0];
  if (website.startsWith('http://')) website = `https://${website.slice(7)}`;
  const report = await probe(website, { query: 'samsung' });
  if (report.homepage.error && !report.homepage.status) throw new Error(`website unreachable: ${report.homepage.error}`);
  const manifest = manifestFromFields(fields, report, { issueNumber: issue.number, categories: loadCategories(), countries: loadCountries().countries });
  const dir = path.join(STORES_DIR, manifest.country.toLowerCase(), manifest.id.slice(3));
  const file = path.join(dir, 'manifest.json');
  if (existsSync(file)) throw new Error(`${path.relative(process.cwd(), file)} already exists; use the update flow instead`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  const relative = path.relative(process.cwd(), file);
  if (values.out) writeFileSync(values.out, relative);
  console.log(relative);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`✖ ${error.message}`);
    process.exit(1);
  });
}
