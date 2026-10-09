import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { QUIZ, RESOURCES } from '../content/resources.js';
import { STYLE_PAGES } from '../content/landing.js';
import { scoreQuiz } from '../routes/resources.js';
import { CONTRACT_CHECKLIST } from '../content/contractChecklist.js';

test('every quiz option only scores styles that have a style page', () => {
  for (const q of QUIZ) for (const [, scores] of q.options) for (const k of Object.keys(scores)) assert.ok(STYLE_PAGES[k], `unknown style ${k}`);
});

test('quiz scoring picks the style the answers point to', () => {
  const params = new URLSearchParams();
  QUIZ.forEach((q, i) => {
    // choose the option whose top-scoring style is industrial where one exists, else the first
    const j = q.options.findIndex(([, s]) => Object.entries(s).sort((a, b) => b[1] - a[1])[0][0] === 'industrial');
    params.set(`q${i + 1}`, String(j === -1 ? 0 : j));
  });
  const { answered, ranked } = scoreQuiz(params);
  assert.equal(answered, QUIZ.length);
  assert.equal(ranked[0][0], 'industrial');
});

test('unanswered or invalid answers are not counted', () => {
  const p = new URLSearchParams({ q1: '0', q2: '99', q3: 'x' });
  assert.equal(scoreQuiz(p).answered, 1);
  assert.equal(scoreQuiz(new URLSearchParams()).answered, 0);
});

test('every downloadable file exists and is not empty', () => {
  for (const r of RESOURCES.filter((x) => x.file)) {
    const f = new URL(`../public${r.file}`, import.meta.url);
    assert.ok(fs.existsSync(f) && fs.statSync(f).size > 5000, `${r.file} missing or tiny`);
  }
});

test('the contract checklist never presents itself as the CaseTrust contract or quotes percentages', () => {
  const text = JSON.stringify(CONTRACT_CHECKLIST);
  assert.match(text, /not the CaseTrust standard contract/i);
  assert.doesNotMatch(text, /\d+\s?%/);
});
