import test from 'node:test';
import assert from 'node:assert/strict';
import { submissionProblems, MIN_WORDS } from '../routes/articles.js';
import { renderMarkdown } from '../lib/markdown.js';

const long = Array(MIN_WORDS + 10).fill('word').join(' ');

test('submission needs title, intro and enough words', () => {
  assert.deepEqual(submissionProblems({ title: 'T', excerpt: 'x'.repeat(50), body: long }), []);
  assert.equal(submissionProblems({ title: '', excerpt: 'x'.repeat(50), body: long }).length, 1);
  assert.equal(submissionProblems({ title: 'T', excerpt: 'short', body: long }).length, 1);
  assert.match(submissionProblems({ title: 'T', excerpt: 'x'.repeat(50), body: 'too few words' })[0], /at least 500 words/);
});

test('firm articles: external links are nofollow and images are dropped', () => {
  const src = 'See [my site](https://example.com) and ![pixel](https://evil.example/p.gif) and [home](/designers).';
  const firm = renderMarkdown(src, { firm: true }).html;
  assert.match(firm, /rel="nofollow ugc noopener noreferrer"/);
  assert.ok(!firm.includes('<img'));
  assert.match(firm, /href="\/designers"/);
  const editorial = renderMarkdown(src).html;
  assert.ok(editorial.includes('<img'));
  assert.ok(!editorial.includes('nofollow'));
});
