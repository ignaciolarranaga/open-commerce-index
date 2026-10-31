#!/usr/bin/env node
/**
 * Fingerprints one store website and verifies how an assistant can search it.
 *
 *   node scripts/probe.js https://www.example.com.uy --query cafetera
 *
 * Prints JSON. The `manifest_access` block can be copied into a manifest's `access` field.
 * The probe identifies itself, honours robots.txt for its own user agent, sends at most a
 * dozen requests, and only reads public pages.
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { safeFetch, PROBE_AGENT_TOKEN } from './lib/http.js';
import { parseRobots, isAllowed, robotsVerdicts } from './lib/robots.js';
import {
  detectPlatform, searchCandidates, endpointCandidates, fillTemplate, visibleText, countTerm,
  detectBotProtection, htmlLanguage, currencyHints,
} from './lib/platform.js';
import { today } from './lib/data.js';

const MIN_SEARCH_HITS = 5;
const MIN_HITS_ABOVE_ECHO = 2;
const NONSENSE_QUERY = 'zqxjvkw';
const MAX_SEARCH_ATTEMPTS = 6;
const PAUSE_MS = 300;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pathOf = (url) => {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
};

export async function probe(inputUrl, { query = 'samsung', pauseMs = PAUSE_MS } = {}) {
  const start = new URL(inputUrl);
  const log = [];
  const report = { input_url: inputUrl, checked_at: new Date().toISOString(), test_query: query, attempts: log };

  const robotsResponse = await safeFetch(`${start.origin}/robots.txt`, { maxBytes: 512 * 1024 });
  let robots = null;
  if (robotsResponse.status === 200) robots = parseRobots(robotsResponse.text);
  else if (robotsResponse.status >= 400 && robotsResponse.status < 500) robots = parseRobots('');
  report.robots_txt = robotsResponse.error ? `error: ${robotsResponse.error}` : `HTTP ${robotsResponse.status}`;
  const mayFetch = (url) => !robots || (isAllowed(robots, PROBE_AGENT_TOKEN, pathOf(url)) && isAllowed(robots, '*', pathOf(url)));

  await pause(pauseMs);
  const home = await safeFetch(start.toString());
  const origin = home.finalUrl ? new URL(home.finalUrl).origin : start.origin;
  const html = home.text || '';
  const text = visibleText(html);
  report.final_url = home.finalUrl;
  report.origin = origin;
  report.homepage = { status: home.status ?? null, error: home.error ?? null, bytes: html.length, visible_chars: text.length };
  report.title = (html.match(/<title[^>]*>([^<]{0,200})/i) || [])[1]?.trim() || null;
  report.meta_description = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})/i) || [])[1] || null;
  report.language_hint = htmlLanguage(html);
  report.currency_hints = currencyHints(text);

  const platform = detectPlatform(html, home.headers || {});
  report.platform = platform;
  const botProtection = detectBotProtection(home);
  report.bot_protection = botProtection;

  const search = { url_template: null, status: 'unverified', notes: undefined };
  let bestUnverified = null;
  let firstRobotsBlocked = null;
  if (botProtection === 'none') {
    const candidates = searchCandidates(platform.platform, origin, html).slice(0, MAX_SEARCH_ATTEMPTS);
    for (const template of candidates) {
      const url = fillTemplate(template, query);
      if (!mayFetch(url)) {
        log.push({ kind: 'search', template, skipped: 'robots.txt disallows this path' });
        firstRobotsBlocked ??= template;
        continue;
      }
      await pause(pauseMs);
      const response = await safeFetch(url);
      const sameOrigin = response.finalUrl && new URL(response.finalUrl).origin === origin;
      const landedHome = response.finalUrl && new URL(response.finalUrl).pathname === '/' && !new URL(response.finalUrl).search;
      const usable = response.status === 200 && sameOrigin && !landedHome;
      const hits = response.text ? countTerm(visibleText(response.text), query) : 0;
      const attempt = { kind: 'search', template, status: response.status ?? null, error: response.error, final_url: response.finalUrl, visible_hits: hits };
      log.push(attempt);
      let verified = usable && hits >= MIN_SEARCH_HITS;
      if (usable && !verified && hits >= MIN_HITS_ABOVE_ECHO) {
        // Few hits: compare with how often a nonsense query is echoed back by the same page.
        await pause(pauseMs);
        const baseline = await safeFetch(fillTemplate(template, NONSENSE_QUERY));
        const echo = baseline.text ? countTerm(visibleText(baseline.text), NONSENSE_QUERY) : 0;
        attempt.echo_hits = echo;
        verified = hits - echo >= MIN_HITS_ABOVE_ECHO;
      }
      if (verified) {
        search.url_template = template;
        search.status = 'verified';
        break;
      }
      if (usable && (!bestUnverified || hits > bestUnverified.hits)) bestUnverified = { template, hits };
    }
    if (search.status !== 'verified' && bestUnverified) {
      search.url_template = bestUnverified.template;
      search.notes = 'The search page loads, but results did not appear in the HTML; they probably render with JavaScript.';
    } else if (search.status !== 'verified' && firstRobotsBlocked) {
      search.url_template = firstRobotsBlocked;
      search.notes = 'robots.txt disallows search URLs for generic crawlers, so the probe did not test this path.';
    }
  } else {
    search.notes = `Homepage returned ${home.status ?? home.error}; automated access looks restricted (${botProtection}).`;
  }

  const endpoints = [];
  if (botProtection === 'none') {
    for (const candidate of endpointCandidates(platform.platform, origin)) {
      const url = fillTemplate(candidate.url, query);
      if (!mayFetch(url)) {
        log.push({ kind: candidate.type, url: candidate.url, skipped: 'robots.txt disallows this path' });
        continue;
      }
      await pause(pauseMs);
      const response = await safeFetch(url, { headers: { accept: 'application/json' }, maxBytes: 1024 * 1024 });
      let json = null;
      try {
        json = JSON.parse(response.text);
      } catch {
        // not JSON (or truncated)
      }
      const hits = response.text ? countTerm(response.text, query) : 0;
      log.push({ kind: candidate.type, url: candidate.url, status: response.status ?? null, error: response.error, json: Boolean(json), hits });
      if (response.status === 200 && json) {
        const status = candidate.type === 'products_feed' || hits > 0 ? 'verified' : 'unverified';
        endpoints.push({ type: candidate.type, url: candidate.url, status });
      }
    }

    for (const name of ['llms.txt', 'faq-ai.txt']) {
      if (!mayFetch(`${origin}/${name}`)) continue;
      await pause(pauseMs);
      const response = await safeFetch(`${origin}/${name}`, { headers: { accept: 'text/plain' }, maxBytes: 256 * 1024 });
      const contentType = response.headers?.['content-type'] || '';
      const looksText = response.status === 200 && /text\/plain|text\/markdown/i.test(contentType) && !/^\s*<(!doctype|html)/i.test(response.text || '') && (response.text || '').trim().length > 40;
      log.push({ kind: 'ai_text', url: `${origin}/${name}`, status: response.status ?? null, error: response.error, content_type: contentType || null, accepted: looksText });
      if (looksText) endpoints.push({ type: 'ai_text', url: `${origin}/${name}`, status: 'verified', notes: `Plain-text ${name} published by the store for AI assistants.` });
    }

    await pause(pauseMs);
    const ucp = await safeFetch(`${origin}/.well-known/ucp`, { headers: { accept: 'application/json' }, maxBytes: 256 * 1024 });
    log.push({ kind: 'ucp', status: ucp.status ?? null, error: ucp.error });
    if (ucp.status === 200) {
      try {
        JSON.parse(ucp.text);
        endpoints.push({ type: 'ucp', url: `${origin}/.well-known/ucp`, status: 'verified' });
      } catch {
        // not a UCP profile
      }
    }

    if (platform.platform === 'shopify' && mayFetch(`${origin}/api/mcp`)) {
      await pause(pauseMs);
      const mcp = await safeFetch(`${origin}/api/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
        maxBytes: 256 * 1024,
      });
      let tools = null;
      try {
        tools = JSON.parse(mcp.text)?.result?.tools?.map((tool) => tool.name) ?? null;
      } catch {
        // not an MCP response
      }
      log.push({ kind: 'mcp', status: mcp.status ?? null, error: mcp.error, tools });
      if (mcp.status === 200 && tools) {
        endpoints.push({ type: 'mcp', url: `${origin}/api/mcp`, status: 'verified', notes: `Shopify storefront MCP; tools: ${tools.join(', ')}`.slice(0, 300) });
      }
    }
  }

  const sameHostSitemaps = (robots?.sitemaps || []).filter((url) => {
    try {
      return new URL(url).hostname === new URL(origin).hostname && url.startsWith('https://');
    } catch {
      return false;
    }
  });
  for (const url of sameHostSitemaps.slice(0, 1)) endpoints.push({ type: 'sitemap', url, status: 'unverified', notes: 'Declared in robots.txt.' });

  let rendering = 'unknown';
  if (search.status === 'verified') rendering = 'server';
  else if (home.status === 200 && text.length < 2000) rendering = 'client';
  else if (home.status === 200 && search.url_template) rendering = 'mixed';

  const robotsPath = search.url_template ? pathOf(fillTemplate(search.url_template, query)) : '/';
  const verdicts = robotsVerdicts(robots, robotsPath);
  report.robots = verdicts;

  report.manifest_access = {
    platform: platform.platform,
    rendering,
    bot_protection: botProtection,
    robots: { generic: verdicts.generic, ai_user_agents: verdicts.ai_user_agents },
    search: Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined)),
    endpoints,
    last_checked: today(),
  };
  return report;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { query: { type: 'string', short: 'q' }, help: { type: 'boolean', short: 'h' } },
  });
  if (values.help || positionals.length !== 1) {
    console.log('Usage: node scripts/probe.js <https://store.example> [--query <term the store should sell>]');
    process.exit(values.help ? 0 : 2);
  }
  const report = await probe(positionals[0], { query: values.query || 'samsung' });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
