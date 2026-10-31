/**
 * Platform fingerprints and the search and data paths each platform is known to expose.
 * Everything here is a candidate: the probe verifies each one against the live site.
 */

const FINGERPRINTS = [
  { platform: 'fenicio', html: [/fenicio/i, /\/fenicio\.js|fenicio\.io/i], headers: [] },
  { platform: 'shopify', html: [/cdn\.shopify\.com/i, /Shopify\.theme/, /myshopify\.com/i], headers: ['x-shopid', 'x-shopify-stage'] },
  { platform: 'vtex', html: [/vtexassets\.com/i, /vteximg\.com/i, /vtex\.render-runtime|vtex-io|\bvtex\.[a-z-]+@/i], headers: ['x-vtex-cache-status-janus-edge', 'x-vtex-io-cluster-id'] },
  { platform: 'woocommerce', html: [/woocommerce/i, /wc-ajax|wc-block/i], headers: [] },
  { platform: 'magento', html: [/Magento_[A-Za-z]+/, /"mage\/[a-z]/i, /\/static\/version\d+\/frontend\//i, /\bmage-init\b/i], headers: ['x-magento-tags', 'x-magento-cache-debug'] },
  { platform: 'tiendanube', html: [/tiendanube|nuvemshop/i, /d26lpennugtm8s\.cloudfront\.net/i], headers: [] },
  { platform: 'prestashop', html: [/prestashop/i], headers: [] },
  { platform: 'wix', html: [/static\.wixstatic\.com/i, /_wixCssImports|wix-bolt/i], headers: ['x-wix-request-id'] },
];

export function detectPlatform(html = '', headers = {}) {
  const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const scores = FINGERPRINTS.map((fingerprint) => {
    const evidence = [];
    for (const pattern of fingerprint.html) if (pattern.test(html)) evidence.push(`html:${pattern.source}`);
    for (const header of fingerprint.headers) if (header in lowerHeaders) evidence.push(`header:${header}`);
    return { platform: fingerprint.platform, evidence };
  }).filter((entry) => entry.evidence.length);
  scores.sort((a, b) => b.evidence.length - a.evidence.length);
  if (!scores.length) return { platform: 'unknown', evidence: [] };
  return { platform: scores[0].platform, evidence: scores[0].evidence, alternatives: scores.slice(1).map((s) => s.platform) };
}

const SEARCH_PATHS = {
  fenicio: ['/catalogo?q={query}'],
  shopify: ['/search?q={query}&type=product'],
  vtex: ['/{query}?_q={query}&map=ft', '/busca?ft={query}', '/s?q={query}'],
  woocommerce: ['/?s={query}&post_type=product'],
  magento: ['/catalogsearch/result/?q={query}'],
  tiendanube: ['/search/?q={query}'],
  prestashop: ['/buscar?controller=search&s={query}', '/search?controller=search&s={query}'],
  wix: ['/search-results?q={query}'],
};

const GENERIC_SEARCH_PATHS = ['/buscar?q={query}', '/search?q={query}', '/busqueda?q={query}', '/catalogo?q={query}', '/catalogsearch/result/?q={query}', '/?s={query}'];

const JSON_ENDPOINTS = {
  shopify: [
    { type: 'json_search', path: '/search/suggest.json?q={query}&resources[type]=product&resources[limit]=10' },
    { type: 'products_feed', path: '/products.json?limit=250' },
  ],
  vtex: [
    { type: 'json_search', path: '/api/io/_v/api/intelligent-search/product_search/?query={query}&count=10' },
    { type: 'json_search', path: '/api/catalog_system/pub/products/search?ft={query}&_from=0&_to=9' },
  ],
  woocommerce: [{ type: 'json_search', path: '/wp-json/wc/store/v1/products?search={query}&per_page=10' }],
};

/** Search URL templates from forms on the page: <form action> with a search-like input. */
export function searchTemplatesFromForms(html, origin) {
  const templates = [];
  const formPattern = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let match;
  while ((match = formPattern.exec(html))) {
    const attributes = match[1];
    if (/method\s*=\s*["']?post/i.test(attributes)) continue;
    const action = (attributes.match(/action\s*=\s*["']([^"']*)["']/i) || [])[1];
    const input = match[2].match(/<input\b[^>]*\bname\s*=\s*["'](q|s|search|query|ft|text|busqueda|keyword|term|k)["'][^>]*>/i);
    if (!input) continue;
    if (!/type\s*=\s*["']?(search|text)/i.test(input[0]) && !/search|busc/i.test(match[0])) continue;
    try {
      const target = new URL(action || '/', origin);
      if (target.origin !== origin) continue;
      target.search = '';
      templates.push(`${target.toString()}?${input[1]}={query}`);
    } catch {
      // ignore malformed actions
    }
  }
  return [...new Set(templates)];
}

export function searchCandidates(platform, origin, html = '') {
  const fromPlatform = (SEARCH_PATHS[platform] || []).map((p) => origin + p);
  const fromForms = searchTemplatesFromForms(html, origin);
  const generic = GENERIC_SEARCH_PATHS.map((p) => origin + p);
  return [...new Set([...fromPlatform, ...fromForms, ...generic])];
}

export function endpointCandidates(platform, origin) {
  return (JSON_ENDPOINTS[platform] || []).map((candidate) => ({ type: candidate.type, url: origin + candidate.path }));
}

export function fillTemplate(template, query) {
  return template.split('{query}').join(encodeURIComponent(query));
}

/** Text a person would read: scripts, styles and tags removed, entities lightly decoded. */
export function visibleText(html = '') {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/\s+/g, ' ')
    .trim();
}

function fold(value) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function countTerm(text, term) {
  const haystack = fold(text);
  const needle = fold(term);
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export function detectBotProtection(response) {
  if (!response || response.error) return 'unknown';
  const headers = response.headers || {};
  const text = response.text || '';
  const challengeMarkers = /Just a moment\.\.\.|cf-chl|challenge-platform\/h\/|Attention Required! \| Cloudflare|captcha-delivery|_Incapsula_Resource|px-captcha/i;
  if (headers['cf-mitigated'] === 'challenge' || ([403, 429, 503].includes(response.status) && challengeMarkers.test(text))) return 'challenge';
  if ([401, 403, 429].includes(response.status)) return 'blocked';
  if (response.status >= 200 && response.status < 400) return 'none';
  return 'unknown';
}

export function htmlLanguage(html = '') {
  const lang = (html.match(/<html\b[^>]*\blang\s*=\s*["']([a-zA-Z-]+)["']/i) || [])[1];
  return lang ? lang.split('-')[0].toLowerCase() : null;
}

export function currencyHints(text = '') {
  const hints = new Set();
  if (/U\$S|US\$|\bUSD\b/.test(text)) hints.add('USD');
  if (/\$U|\bUYU\b|\$\s?\d{1,3}(\.\d{3})+(?!\d)/.test(text)) hints.add('UYU');
  if (/\bARS\b/.test(text)) hints.add('ARS');
  if (/\bBRL\b|R\$/.test(text)) hints.add('BRL');
  if (/€|\bEUR\b/.test(text)) hints.add('EUR');
  return [...hints];
}
