import { lookup } from 'node:dns/promises';
import net from 'node:net';

export const PROBE_USER_AGENT =
  'Mozilla/5.0 (compatible; OpenCommerceIndexProbe/0.1; +https://github.com/ignaciolarranaga/open-commerce-index)';
export const PROBE_AGENT_TOKEN = 'OpenCommerceIndexProbe';

const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const lower = address.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(lower);
}

/** Rejects non-https URLs and hosts that resolve to private, loopback or link-local addresses. */
export async function assertPublicHttps(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`only https URLs are allowed: ${url}`);
  if (parsed.username || parsed.password) throw new Error('URLs with credentials are not allowed');
  if (net.isIP(parsed.hostname)) throw new Error('IP-literal hosts are not allowed');
  const addresses = await lookup(parsed.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`host resolves to a non-public address: ${parsed.hostname}`);
  }
  return parsed;
}

/**
 * Fetches a public https URL with a timeout, a response-size cap and manual,
 * re-validated redirects. Never throws: failures come back as { error }.
 */
export async function safeFetch(url, { method = 'GET', headers = {}, body, timeoutMs = 20000, maxBytes = DEFAULT_MAX_BYTES, maxRedirects = 5 } = {}) {
  let current = url;
  const started = Date.now();
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      await assertPublicHttps(current);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs - (Date.now() - started)));
      let response;
      try {
        response = await fetch(current, {
          method,
          body,
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'user-agent': PROBE_USER_AGENT, accept: 'text/html,application/json;q=0.9,*/*;q=0.8', 'accept-language': 'es-UY,es;q=0.9,en;q=0.8', ...headers },
        });
        if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
          current = new URL(response.headers.get('location'), current).toString();
          await response.body?.cancel();
          continue;
        }
        const { text, truncated } = await readCapped(response, maxBytes);
        return { url, finalUrl: current, status: response.status, headers: Object.fromEntries(response.headers), text, truncated, ms: Date.now() - started };
      } finally {
        clearTimeout(timer);
      }
    }
    return { url, finalUrl: current, error: 'too many redirects' };
  } catch (error) {
    return { url, finalUrl: current, error: error.name === 'AbortError' ? 'timeout' : error.message };
  }
}

async function readCapped(response, maxBytes) {
  if (!response.body) return { text: '', truncated: false };
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      chunks.push(value.subarray(0, value.length - (size - maxBytes)));
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return { text: Buffer.concat(chunks).toString('utf8'), truncated };
}
