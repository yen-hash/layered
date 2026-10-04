import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, slugify } from '../lib/markdown.js';

test('raw HTML in the source is escaped, never passed through', () => {
  const { html } = renderMarkdown('Hello <script>alert(1)</script> <img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('javascript: and protocol-relative URLs are dropped from links and images', () => {
  const { html } = renderMarkdown('[a](javascript:alert(1)) [b](//evil.com) ![c](javascript:alert(1)) [ok](/designers) [ext](https://example.com)');
  assert.ok(!/href="javascript/i.test(html));
  assert.ok(!html.includes('href="//evil.com'));
  assert.ok(!/src="javascript/i.test(html));
  assert.ok(html.includes('href="/designers"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test('an author # heading becomes h2 so the page keeps a single h1', () => {
  const { html, headings } = renderMarkdown('# Title\n\n## Second\n\n### Third');
  assert.ok(!html.includes('<h1'));
  assert.deepEqual(headings.map((h) => h.text), ['Title', 'Second']);
});

test('tables, lists and emphasis render', () => {
  const { html } = renderMarkdown('| A | B |\n|---|---|\n| 1 | **2** |\n\n- x\n- y\n\n1. one\n2. two');
  assert.ok(html.includes('<table'));
  assert.ok(html.includes('<strong>2</strong>'));
  assert.ok(html.includes('<ul>') && html.includes('<ol>'));
});

test('duplicate headings get unique ids', () => {
  const { headings } = renderMarkdown('## Same\n\n## Same');
  assert.notEqual(headings[0].id, headings[1].id);
});

test('slugify is stable and url-safe', () => {
  assert.equal(slugify('HDB & Condo: Which? (2026)'), 'hdb-and-condo-which-2026');
  assert.equal(slugify('  '), '');
});
