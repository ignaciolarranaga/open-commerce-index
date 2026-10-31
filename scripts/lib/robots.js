/**
 * Minimal robots.txt evaluator following RFC 9309: groups by user-agent,
 * the most specific matching group wins (falling back to "*"), rules use
 * "*" and "$" wildcards, the longest matching rule wins, and Allow wins ties.
 */

export const AI_USER_AGENTS = ['ChatGPT-User', 'Claude-User', 'Perplexity-User'];
export const AI_SEARCH_AGENTS = ['OAI-SearchBot', 'Claude-SearchBot'];

export function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'allow' || key === 'disallow') {
      current.rules.push({ allow: key === 'allow', path: value });
    }
  }
  return { groups, sitemaps };
}

function rulesFor(parsed, userAgent) {
  const token = userAgent.toLowerCase().split('/')[0];
  const specific = parsed.groups.filter((group) => group.agents.some((agent) => agent !== '*' && token === agent));
  if (specific.length) return specific.flatMap((group) => group.rules);
  return parsed.groups.filter((group) => group.agents.includes('*')).flatMap((group) => group.rules);
}

function patternToRegExp(pattern) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** True when the path (with query string) may be fetched by the given user agent. */
export function isAllowed(parsed, userAgent, pathWithQuery) {
  const rules = rulesFor(parsed, userAgent);
  let best = null;
  for (const rule of rules) {
    if (rule.path === '') continue; // "Disallow:" with no value allows everything
    if (!patternToRegExp(rule.path).test(pathWithQuery)) continue;
    const length = rule.path.length;
    if (!best || length > best.length || (length === best.length && rule.allow && !best.allow)) {
      best = { length, allow: rule.allow };
    }
  }
  return best ? best.allow : true;
}

/**
 * Verdicts used in manifests. "generic" uses "*". "ai_user_agents" is "disallowed"
 * when any assistant user agent that fetches on behalf of a person is disallowed.
 */
export function robotsVerdicts(parsed, pathWithQuery) {
  if (!parsed) return { generic: 'unknown', ai_user_agents: 'unknown', details: {} };
  const details = {};
  for (const agent of [...AI_USER_AGENTS, ...AI_SEARCH_AGENTS]) {
    details[agent] = isAllowed(parsed, agent, pathWithQuery) ? 'allowed' : 'disallowed';
  }
  const generic = isAllowed(parsed, '*', pathWithQuery) ? 'allowed' : 'disallowed';
  const aiBlocked = AI_USER_AGENTS.some((agent) => details[agent] === 'disallowed');
  return { generic, ai_user_agents: aiBlocked ? 'disallowed' : 'allowed', details };
}
