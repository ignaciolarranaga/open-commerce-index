#!/usr/bin/env node
/**
 * Re-probes every store and compares the result with the manifest's `access` field.
 * Writes a Markdown report (and optional JSON) and never edits manifests: a probe from a
 * datacenter address can fail where a person's assistant succeeds, so changes need a human.
 *
 *   node scripts/check-access.js [--out reports/access-report.md] [--json reports/access-report.json] [--only uy-slug]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadStores } from './lib/data.js';
import { probe } from './probe.js';
import { fillTemplate } from './lib/platform.js';

const { values } = parseArgs({ options: { out: { type: 'string' }, json: { type: 'string' }, only: { type: 'string' }, query: { type: 'string' } } });
const stores = loadStores().filter((store) => store.manifest && (!values.only || store.manifest.id === values.only));
const results = [];

for (const store of stores) {
  const m = store.manifest;
  const query = values.query || guessQuery(m);
  process.stderr.write(`probing ${m.id} (${query})… `);
  const report = await probe(m.website, { query });
  const a = report.manifest_access;
  const differences = [];
  const compare = (label, before, after) => {
    if (before !== after) differences.push(`${label}: ${before} → ${after}`);
  };
  compare('platform', m.access.platform, a.platform);
  compare('rendering', m.access.rendering, a.rendering);
  compare('bot_protection', m.access.bot_protection, a.bot_protection);
  compare('robots.ai_user_agents', m.access.robots.ai_user_agents, a.robots.ai_user_agents);
  compare('search.status', m.access.search.status, a.search.status);
  if ((m.access.search.url_template || null) !== (a.search.url_template || null)) differences.push(`search.url_template: ${m.access.search.url_template} → ${a.search.url_template}`);
  const before = new Set(m.access.endpoints.filter((e) => e.status === 'verified').map((e) => `${e.type} ${e.url}`));
  const after = new Set(a.endpoints.filter((e) => e.status === 'verified').map((e) => `${e.type} ${e.url}`));
  for (const item of before) if (!after.has(item)) differences.push(`endpoint no longer verified: ${item}`);
  for (const item of after) if (!before.has(item)) differences.push(`new verified endpoint: ${item}`);
  const homepage = report.homepage.status ?? report.homepage.error;
  results.push({ id: m.id, name: m.name, website: m.website, homepage, query, differences, last_checked: m.access.last_checked, probed: a });
  process.stderr.write(`${differences.length ? `${differences.length} difference(s)` : 'no change'}\n`);
}

const date = new Date().toISOString().slice(0, 10);
const changed = results.filter((r) => r.differences.length);
const lines = [
  `# Store access report, ${date}`,
  '',
  `Probed ${results.length} store(s) from a GitHub Actions runner. ${changed.length} show differences against their manifest.`,
  '',
  '> Runner IP addresses are often blocked by bot protection. A failure here is a prompt to re-check by hand, not a verdict. This job never edits manifests.',
  '',
  '| Store | Homepage | Search | Differences |',
  '|---|---|---|---|',
  ...results.map((r) => `| [${r.name}](${r.website}) \`${r.id}\` | ${r.homepage} | ${r.probed.search.status} | ${r.differences.length ? r.differences.map((d) => `• ${d}`).join('<br>') : '—'} |`),
  '',
  changed.length ? '## Suggested follow-up' : '',
  ...changed.map((r) => `- \`${r.id}\`: run \`node scripts/probe.js ${r.website}\` locally and, if the change holds, update \`access\` in a pull request.`),
  '',
];
const markdown = lines.join('\n');
if (values.out) {
  mkdirSync(path.dirname(values.out), { recursive: true });
  writeFileSync(values.out, markdown);
}
if (values.json) {
  mkdirSync(path.dirname(values.json), { recursive: true });
  writeFileSync(values.json, `${JSON.stringify({ date, results }, null, 2)}\n`);
}
if (!values.out) console.log(markdown);

/** A query the store should plausibly match, from its primary category. */
function guessQuery(manifest) {
  const byCategory = { coffee: 'cafetera', 'small-appliances': 'cafetera', appliances: 'heladera', 'large-appliances': 'heladera', climate: 'aire acondicionado', computing: 'notebook', phones: 'celular', 'tv-audio': 'televisor', gaming: 'consola', 'home-furniture': 'mesa', bedding: 'colchon', grocery: 'arroz', office: 'cuaderno', 'health-beauty': 'perfume', sports: 'bicicleta', toys: 'juguete', fashion: 'zapatillas', 'hardware-tools': 'taladro', general: 'samsung' };
  return byCategory[manifest.categories[0]] || 'samsung';
}
export { fillTemplate };
