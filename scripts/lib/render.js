import { escapeHtml as esc, inline } from './markdown.js';

/** Layout shared by every page. `page` = { lang, path, title, description, body, alternate, nav } */
export function layout(page, ctx) {
  const { strings, config } = ctx;
  const t = strings[page.lang];
  const base = config.basePath;
  const url = (p) => `${base}${p}`.replace(/\/{2,}/g, '/');
  const navItems = [
    ['', t.nav.home],
    ['connect/', t.nav.connect],
    ['merchants/', t.nav.merchants],
    ['directory/', t.nav.directory],
    ['agents/', t.nav.agents],
    ['about/', t.nav.about],
  ];
  const current = page.nav || '';
  const alternate = page.alternate || `${page.lang === 'es' ? 'en' : 'es'}/${page.path}`;
  const canonical = `${config.baseUrl}${page.lang}/${page.path}`.replace(/\/{2,}(?!\/)/g, '/').replace(':/', '://');
  return `<!doctype html>
<html lang="${page.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} · OpenCommerceIndex</title>
<meta name="description" content="${esc(page.description || t.tagline)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${page.lang === 'es' ? 'en' : 'es'}" href="${config.baseUrl}${alternate}">
<link rel="alternate" type="application/json" href="${config.baseUrl}index.json" title="OpenCommerceIndex root index">
<link rel="stylesheet" href="${url('styles/site.css')}">
<link rel="icon" href="${url('assets/favicon.svg')}" type="image/svg+xml">
</head>
<body>
<a class="skip" href="#main">${page.lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
<header class="top"><div class="wrap">
<a class="brand" href="${url(`${page.lang}/`)}">Open<span>Commerce</span>Index</a>
<nav class="main" aria-label="${page.lang === 'es' ? 'Principal' : 'Main'}">
${navItems.map(([p, label]) => `<a href="${url(`${page.lang}/${p}`)}"${p === current ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('\n')}
</nav>
<div class="lang"><a href="${url(alternate)}" hreflang="${page.lang === 'es' ? 'en' : 'es'}" lang="${page.lang === 'es' ? 'en' : 'es'}">${esc(t.switch_label)}</a></div>
</div></header>
<main id="main"><div class="wrap">
${page.body}
</div></main>
<footer class="bottom"><div class="wrap">
<a href="${config.repoUrl}">${esc(t.footer.repo)}</a>
<a href="${config.pluginRepoUrl}">${esc(t.footer.plugin_repo)}</a>
<a href="${config.discussionsUrl}">${esc(t.footer.discussions)}</a>
<a href="${config.releasesUrl}">${esc(t.footer.releases)}</a>
<a href="${url(`${page.lang}/privacy/`)}">${esc(t.footer.privacy)}</a>
<a href="${url(`${page.lang}/terms/`)}">${esc(t.footer.terms)}</a>
<span>${esc(t.footer.license)}</span>
<span>${esc(t.footer.generated)} ${ctx.generatedAt.slice(0, 10)} · ${esc(ctx.revision)}</span>
</div></footer>
</body>
</html>
`;
}

export function badge(label, tone = '') {
  return `<span class="badge${tone ? ` ${tone}` : ''}">${esc(label)}</span>`;
}

const TONES = {
  verified: 'ok', confirmed: 'ok', allowed: 'ok', none: 'ok', yes: 'ok', server: 'ok',
  partial: 'warn', unverified: 'warn', unknown: 'warn', mixed: 'warn', challenge: 'warn',
  failing: 'bad', disallowed: 'bad', blocked: 'bad', client: 'warn', no: '',
};

export function valueBadge(value, t) {
  const label = t.values[value] ?? value;
  return badge(label, TONES[value] ?? '');
}

export function categoryLabel(id, categories, lang) {
  const category = categories.find((c) => c.id === id);
  return category ? category.labels[lang] : id;
}

/** Store profile page body. */
export function storePage(store, ctx, lang) {
  const t = ctx.strings[lang];
  const m = store.manifest;
  const base = ctx.config.basePath;
  const url = (p) => `${base}${p}`;
  const description = lang === 'es' && m.description_es ? m.description_es : m.description;
  const countryName = ctx.countries.find((c) => c.country === m.country)?.names[lang] || m.country;
  const shipsTo = m.fulfillment.ships_to.map((s) => {
    const name = ctx.countries.find((c) => c.country === s.country)?.names[lang] || s.country;
    return `${esc(name)} ${valueBadge(s.coverage, t)}${s.notes ? ` <span class="muted small">${esc(s.notes)}</span>` : ''}`;
  }).join('<br>');
  const endpoints = m.access.endpoints.length
    ? `<ul>${m.access.endpoints.map((e) => `<li>${esc(t.values[e.type] || e.type)} ${valueBadge(e.status, t)} <a href="${esc(e.url)}" rel="nofollow noopener">${esc(e.url)}</a>${e.notes ? `<br><span class="muted small">${esc(e.notes)}</span>` : ''}</li>`).join('')}</ul>`
    : `<p class="muted">—</p>`;
  const sources = `<ul>${m.provenance.sources.map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener">${esc(s.url)}</a> <span class="muted small">${esc(s.supports)} · ${esc(s.accessed_on)}</span></li>`).join('')}</ul>`;
  const issueBase = ctx.config.repoUrl;
  const storeParam = `&store_id=${encodeURIComponent(m.id)}`;
  return `
<p class="crumbs"><a href="${url(`${lang}/directory/`)}">${esc(t.directory.title)}</a> › <a href="${url(`${lang}/directory/${m.country.toLowerCase()}/`)}">${esc(countryName)}</a></p>
<h1>${esc(m.name)}</h1>
<p class="lede">${esc(description)}</p>
<p class="actions"><a class="btn" href="${esc(m.website)}" rel="nofollow noopener">${esc(t.store.visit)}</a>
<a class="btn secondary" href="${url(`stores/${m.country.toLowerCase()}/${store.slug}.json`)}">${esc(t.store.json)}</a>
<a class="btn secondary" href="${url(`stores/${m.country.toLowerCase()}/${store.slug}.md`)}">${esc(t.store.markdown)}</a></p>
<dl class="facts">
<dt>${esc(t.store.website)}</dt><dd><a href="${esc(m.website)}" rel="nofollow noopener">${esc(m.website)}</a></dd>
<dt>${esc(t.store.country)}</dt><dd>${esc(countryName)}</dd>
<dt>${esc(t.store.categories)}</dt><dd>${m.categories.map((c) => `<a href="${url(`${lang}/directory/${m.country.toLowerCase()}/${c}/`)}">${esc(categoryLabel(c, ctx.categories, lang))}</a>`).join(', ')}</dd>
${m.brands?.length ? `<dt>${esc(t.store.brands)}</dt><dd>${m.brands.map(esc).join(', ')}</dd>` : ''}
<dt>${esc(t.store.ships_to)}</dt><dd>${shipsTo}</dd>
<dt>${esc(t.store.pickup)}</dt><dd>${valueBadge(m.fulfillment.pickup, t)}${m.fulfillment.pickup_notes ? ` <span class="muted small">${esc(m.fulfillment.pickup_notes)}</span>` : ''}</dd>
<dt>${esc(t.store.languages)}</dt><dd>${m.languages.map(esc).join(', ')}</dd>
<dt>${esc(t.store.currencies)}</dt><dd>${m.currencies.map(esc).join(', ')}</dd>
</dl>
${m.shopping_notes ? `<h2>${esc(t.store.notes)}</h2><p>${esc(m.shopping_notes)}</p>` : ''}
<h2>${esc(t.store.access)}</h2>
<dl class="facts">
<dt>${esc(t.store.platform)}</dt><dd>${esc(m.access.platform)} · ${valueBadge(m.access.rendering, t)} · ${valueBadge(m.access.bot_protection, t)}</dd>
<dt>${esc(t.store.search)}</dt><dd>${valueBadge(m.access.search.status, t)} ${m.access.search.url_template ? `<code>${esc(m.access.search.url_template)}</code>` : ''}${m.access.search.notes ? `<br><span class="muted small">${esc(m.access.search.notes)}</span>` : ''}</dd>
<dt>${esc(t.store.robots)}</dt><dd>${valueBadge(m.access.robots.ai_user_agents, t)}</dd>
<dt>${esc(t.store.last_checked)}</dt><dd>${esc(m.access.last_checked)}</dd>
</dl>
<h3>${esc(t.store.endpoints)}</h3>
${endpoints}
<h2>${esc(t.store.provenance)}</h2>
<p>${valueBadge(m.provenance.origin, t)} · ${esc(t.store.added_on)} ${esc(m.provenance.added_on)}</p>
${sources}
<h2>${esc(t.store.verification)}</h2>
<dl class="facts">
<dt>${esc(t.store.domain_ownership)}</dt><dd>${valueBadge(m.verification.domain_ownership, t)}</dd>
<dt>${esc(t.store.technical_access)}</dt><dd>${valueBadge(m.verification.technical_access, t)}</dd>
<dt>${esc(t.store.last_review)}</dt><dd>${m.verification.last_review ? esc(m.verification.last_review) : esc(t.values.never)}</dd>
</dl>
<p class="muted small">${esc(t.store.disclaimer)}</p>
<p class="small"><a href="${issueBase}/issues/new?template=update-store.yml${storeParam}">${esc(t.store.report)}</a> · <a href="${issueBase}/issues/new?template=claim-store.yml${storeParam}">${esc(t.store.claim)}</a> · <a href="${issueBase}/issues/new?template=remove-store.yml${storeParam}">${esc(t.store.remove)}</a></p>
`;
}

export function storeCard(store, ctx, lang) {
  const m = store.manifest;
  const t = ctx.strings[lang];
  const description = lang === 'es' && m.description_es ? m.description_es : m.description;
  const short = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  return `<li class="card"><h3><a href="${ctx.config.basePath}${lang}/directory/${m.country.toLowerCase()}/stores/${store.slug}/">${esc(m.name)}</a></h3>
<p>${esc(short)}</p>
<p class="meta">${m.categories.slice(0, 3).map((c) => esc(categoryLabel(c, ctx.categories, lang))).join(' · ')}</p>
<p class="meta">${valueBadge(m.access.search.status, t)} ${valueBadge(m.verification.domain_ownership, t)}</p></li>`;
}

/** Generated Markdown README for a store folder (committed, drift-checked) and for dist/stores. */
export function storeMarkdown(store, ctx) {
  const m = store.manifest;
  const cc = m.country.toLowerCase();
  const lines = [];
  lines.push(`# ${m.name}`, '');
  lines.push(`<!-- Generated from manifest.json by scripts/build.js. Do not edit by hand. -->`, '');
  lines.push(m.description, '');
  if (m.description_es) lines.push(`*ES:* ${m.description_es}`, '');
  lines.push('| | |', '|---|---|');
  lines.push(`| Website | <${m.website}> |`);
  lines.push(`| Country | ${m.country} |`);
  lines.push(`| Categories | ${m.categories.join(', ')} |`);
  if (m.brands?.length) lines.push(`| Known brands | ${m.brands.join(', ')} |`);
  lines.push(`| Delivers to | ${m.fulfillment.ships_to.map((s) => `${s.country} (${s.coverage})${s.notes ? `: ${s.notes}` : ''}`).join('; ')} |`);
  lines.push(`| Pickup | ${m.fulfillment.pickup}${m.fulfillment.pickup_notes ? `: ${m.fulfillment.pickup_notes}` : ''} |`);
  lines.push(`| Languages | ${m.languages.join(', ')} |`);
  lines.push(`| Currencies | ${m.currencies.join(', ')} |`);
  lines.push('');
  if (m.shopping_notes) lines.push('## Shopping notes', '', m.shopping_notes, '');
  lines.push('## Assistant access', '');
  lines.push(`- Platform: ${m.access.platform}; rendering: ${m.access.rendering}; bot protection: ${m.access.bot_protection}`);
  lines.push(`- Search (${m.access.search.status}): ${m.access.search.url_template ? `\`${m.access.search.url_template}\`` : 'none known'}${m.access.search.notes ? ` — ${m.access.search.notes}` : ''}`);
  lines.push(`- robots.txt: generic agents ${m.access.robots.generic}; assistant user agents ${m.access.robots.ai_user_agents}`);
  for (const e of m.access.endpoints) lines.push(`- ${e.type} (${e.status}): <${e.url}>${e.notes ? ` — ${e.notes}` : ''}`);
  lines.push(`- Last checked: ${m.access.last_checked}`, '');
  lines.push('## Provenance', '');
  lines.push(`Origin: ${m.provenance.origin}; added on ${m.provenance.added_on}${m.provenance.reviewed_on ? `; reviewed on ${m.provenance.reviewed_on}` : ''}${m.provenance.issue ? `; issue #${m.provenance.issue}` : ''}.`, '');
  for (const s of m.provenance.sources) lines.push(`- <${s.url}> — ${s.supports} (accessed ${s.accessed_on})`);
  lines.push('');
  lines.push('## Verification', '');
  lines.push(`Domain ownership: ${m.verification.domain_ownership}; technical access: ${m.verification.technical_access}; last review: ${m.verification.last_review || 'never'}.`, '');
  lines.push('## Machine-readable', '');
  lines.push(`- JSON: <${ctx.config.baseUrl}stores/${cc}/${store.slug}.json>`);
  lines.push(`- Profile page: <${ctx.config.baseUrl}es/directory/${cc}/stores/${store.slug}/>`);
  lines.push('');
  lines.push('This profile describes how to find information on the store. It is not a commercial recommendation or a guarantee about the seller. Data: CC0 1.0.');
  return `${lines.join('\n')}\n`;
}

export { esc, inline };
