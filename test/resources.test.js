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

import { budgetSummary } from '../content/budgetPlanner.js';
test('budget planner maths: buffer, GST and ceiling', () => {
  const s = budgetSummary({ ceiling: 50000, bufferPct: 10, gstPct: 9, gstIncluded: false, rows: { a: { planned: 20000, chosen: 21000 }, b: { planned: 10000 } }, outside: { f: { planned: 5000 } } });
  assert.equal(Math.round(s.withBuffer), 33000);
  assert.equal(Math.round(s.plannedAll), 35970);
  assert.equal(Math.round(s.everything), 40970);
  assert.equal(s.over, -9030);
  const inc = budgetSummary({ ceiling: 30000, bufferPct: 10, gstPct: 9, gstIncluded: true, rows: { a: { planned: 30000 } } });
  assert.equal(inc.gstAmt, 0);
  assert.equal(inc.over, 3000);
  assert.equal(budgetSummary({ rows: { a: { planned: -5, a: 'x' } } }).totals.planned, 0);
});

import { compareQuotes } from '../content/quoteCompare.js';
test('quote comparison: GST is normalised, missing categories and mismatches are flagged', () => {
  const r = compareQuotes({ gstPct: 9, firms: [
    { name: 'A', gstIncluded: false, stated: 0, lines: { carpentry: 20000, floor: 10000 }, checks: { itemised: true, gst: true } },
    { name: 'B', gstIncluded: true, stated: 40000, lines: { carpentry: 25000, floor: 6000, bath: 5000 }, checks: {} },
    { name: 'C', lines: {} },
  ] });
  assert.equal(Math.round(r.firms[0].inclGst), 32700); // 30,000 + 9%
  assert.equal(Math.round(r.firms[1].exGst), 33028);   // 36,000 / 1.09
  assert.equal(r.cheapest, 0, 'A at 32,700 incl. GST beats B at 36,000 incl. GST');
  assert.equal(r.firms[1].vsLowest, 3300);
  assert.deepEqual(r.firms[0].missing, ['bath']);
  assert.equal(r.firms[1].statedMismatch, true, 'stated 40,000 vs lines 36,000');
  assert.equal(r.firms[0].checks, 2);
  assert.equal(r.comparable, true);
  assert.equal(compareQuotes({ firms: [{ lines: { a: 5 } }] }).comparable, false);
  assert.equal(compareQuotes({ gstPct: 9, firms: [{ lines: { a: -5, b: 'x' } }] }).firms[0].sum, 0);
});

import { planTimeline } from '../content/timeline.js';
test('timeline planner works back from the move-in date and warns correctly', () => {
  const r = planTimeline({ moveIn: '2027-06-30', onSiteWeeks: 10, bufferWeeks: 2, today: '2026-10-29', keyDate: '2027-01-01' });
  assert.equal(r.ok, true);
  assert.equal(r.worksStart, '2027-04-07'); // 12 weeks (84 days) before 30 Jun
  assert.equal(r.worksEnd, '2027-06-16');   // 10 weeks after the start
  const keys = r.milestones.map((m) => m.key);
  assert.deepEqual(keys, ['shortlist', 'sign', 'permit', 'order', 'start', 'end', 'movein', 'dlp']);
  assert.equal(r.milestones[0].from, '2026-10-07'); // 6 months before the start
  assert.equal(r.warnings.length, 0);
  const tight = planTimeline({ moveIn: '2027-01-15', onSiteWeeks: 10, bufferWeeks: 2, today: '2026-10-29', keyDate: '2027-01-01' });
  assert.ok(tight.warnings.some((w) => /key collection/.test(w)));
  assert.ok(tight.warnings.some((w) => /lead time|before today/.test(w)));
  assert.equal(planTimeline({ moveIn: 'nope', onSiteWeeks: 10, today: '2026-10-29' }).ok, false);
  assert.equal(planTimeline({ moveIn: '2027-02-30', onSiteWeeks: 10, today: '2026-10-29' }).ok, false, 'invalid calendar date');
  assert.equal(planTimeline({ moveIn: '2027-06-30', onSiteWeeks: 1, today: '2026-10-29' }).ok, false);
  assert.ok(r.tightest < r.comfortable);
});
