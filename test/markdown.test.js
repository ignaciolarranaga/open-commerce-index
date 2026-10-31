import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, frontMatter, inline } from '../scripts/lib/markdown.js';

test('front matter is split', () => {
  const { data, body } = frontMatter('---\ntitle: Hola\nnav: 2\n---\n# Heading\ntext');
  assert.equal(data.title, 'Hola');
  assert.equal(body, '# Heading\ntext');
});

test('blocks render and html is escaped', () => {
  const html = renderMarkdown('# Title\n\nA **bold** [link](https://x.example) <script>x</script>\n\n- one\n- two\n\n1. first\n2. second\n\n```\ncode <b>\n```');
  assert.match(html, /<h1 id="title">Title<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="https:\/\/x.example">link<\/a>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li>/);
  assert.match(html, /<pre><code>code &lt;b&gt;<\/code><\/pre>/);
});

test('inline code and emphasis', () => {
  assert.equal(inline('use `x` and *y*'), 'use <code>x</code> and <em>y</em>');
});
