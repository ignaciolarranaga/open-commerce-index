import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, isAllowed, robotsVerdicts } from '../scripts/lib/robots.js';

const divinoLike = `
User-agent: *
Allow: /
Disallow: /mi-cuenta/
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-User
Allow: /
Disallow: /backend/
Sitemap: https://shop.example/sitemap
`;

test('groups with several user agents share rules and the specific group wins', () => {
  const parsed = parseRobots(divinoLike);
  assert.equal(parsed.sitemaps[0], 'https://shop.example/sitemap');
  assert.equal(isAllowed(parsed, 'Claude-User', '/catalogo?q=x'), true);
  assert.equal(isAllowed(parsed, 'Claude-User', '/backend/x'), false);
  assert.equal(isAllowed(parsed, '*', '/mi-cuenta/x'), false);
  assert.equal(isAllowed(parsed, 'SomeOtherBot', '/mi-cuenta/x'), false);
});

test('wildcards, anchors and longest-match', () => {
  const parsed = parseRobots('User-agent: *\nDisallow: /*?\nAllow: /catalogo?q=\nDisallow: /*.php$');
  assert.equal(isAllowed(parsed, '*', '/catalogsearch/result/?q=a'), false);
  assert.equal(isAllowed(parsed, '*', '/catalogo?q=a'), true);
  assert.equal(isAllowed(parsed, '*', '/index.php'), false);
  assert.equal(isAllowed(parsed, '*', '/index.php/x'), true);
});

test('empty Disallow allows everything and verdicts summarise agents', () => {
  const parsed = parseRobots('User-agent: *\nDisallow:\n');
  assert.equal(isAllowed(parsed, '*', '/anything'), true);
  assert.deepEqual(robotsVerdicts(parsed, '/x').generic, 'allowed');
  const blocked = parseRobots('User-agent: *\nAllow: /\nUser-agent: ChatGPT-User\nDisallow: /');
  const verdict = robotsVerdicts(blocked, '/catalogo?q=a');
  assert.equal(verdict.generic, 'allowed');
  assert.equal(verdict.ai_user_agents, 'disallowed');
  assert.equal(robotsVerdicts(null, '/x').generic, 'unknown');
});
