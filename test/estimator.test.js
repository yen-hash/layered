// Run with: npm test   (Node's built-in test runner, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { estimate, budgetBand, DATA } from '../content/estimator.js';

const run = (input) => estimate(input, DATA);

test('HDB standard ranges come straight from the data and add the buffer', () => {
  const r = run({ mode: 'hdb', flat: '4-room', condition: 'bto', spec: 'standard' });
  assert.deepEqual([r.low, r.high], [40000, 55000]);
  assert.equal(r.suggestedLow, 44000);   // +10%
  assert.equal(r.suggestedHigh, 63250);  // +15%
  assert.equal(r.openEnded, false);
});

test('premium 4-room is open-ended, and spec is ignored for other flat types', () => {
  assert.equal(run({ mode: 'hdb', flat: '4-room', condition: 'resale', spec: 'premium' }).openEnded, true);
  const r = run({ mode: 'hdb', flat: '3-room', condition: 'resale', spec: 'premium' });
  assert.deepEqual([r.low, r.high, r.openEnded], [45000, 65000, false]);
});

test('resale is never cheaper than BTO for the same flat and spec', () => {
  for (const flat of Object.keys(DATA.hdb)) {
    const bto = run({ mode: 'hdb', flat, condition: 'bto', spec: 'standard' });
    const resale = run({ mode: 'hdb', flat, condition: 'resale', spec: 'standard' });
    assert.ok(resale.low >= bto.low && resale.high >= bto.high, flat);
  }
});

test('bigger HDB flats never cost less than smaller ones (standard spec)', () => {
  const order = ['3-room', '4-room', '5-room'];
  for (const condition of ['bto', 'resale']) {
    for (let i = 1; i < order.length; i++) {
      const a = run({ mode: 'hdb', flat: order[i - 1], condition, spec: 'standard' });
      const b = run({ mode: 'hdb', flat: order[i], condition, spec: 'standard' });
      assert.ok(b.low >= a.low && b.high >= a.high, `${order[i - 1]} -> ${order[i]} ${condition}`);
    }
  }
});

test('condo and office scale with area; premium condo is open-ended', () => {
  const full = run({ mode: 'condo', area: 900, tier: 'full' });
  assert.deepEqual([full.low, full.high], [45000, 108000]);
  const prem = run({ mode: 'condo', area: 1000, tier: 'premium' });
  assert.deepEqual([prem.low, prem.openEnded], [150000, true]);
  const office = run({ mode: 'office', area: 1500, tier: 'mid' });
  assert.deepEqual([office.low, office.high], [150000, 270000]);
});

test('room-by-room adds the kitchen and each bathroom', () => {
  const r = run({ mode: 'rooms', kitchen: 'standard', bathrooms: 2, bathScope: 'rebuild' });
  assert.deepEqual([r.low, r.high], [18000, 31000]);
  assert.deepEqual([run({ mode: 'rooms', kitchen: 'none', bathrooms: 1, bathScope: 'refresh' }).low], [3000]);
});

test('invalid input is rejected with a message, never NaN', () => {
  const bad = [
    { mode: 'condo', area: 50, tier: 'full' },
    { mode: 'condo', area: 'abc', tier: 'full' },
    { mode: 'office', area: 999999, tier: 'basic' },
    { mode: 'rooms', kitchen: 'none', bathrooms: 0, bathScope: 'refresh' },
    { mode: 'rooms', kitchen: 'bogus', bathrooms: 1, bathScope: 'rebuild' },
    { mode: 'hdb', flat: '9-room', condition: 'bto' },
    { mode: 'hdb', flat: '4-room', condition: 'lease' },
    { mode: 'nope' },
    {},
  ];
  for (const input of bad) {
    const r = run(input);
    assert.equal(r.ok, false, JSON.stringify(input));
    assert.ok(typeof r.error === 'string' && r.error.length > 5);
  }
});

test('every range in the data is ordered low <= high and positive', () => {
  const pairs = [];
  for (const f of Object.values(DATA.hdb)) pairs.push(f.bto, f.resale);
  for (const s of Object.values(DATA.hdbSpec4Room)) pairs.push(s.bto, s.resale);
  for (const g of [DATA.kitchen, DATA.bathroom]) for (const v of Object.values(g)) pairs.push(v.range);
  for (const g of [DATA.condo, DATA.office]) for (const v of Object.values(g)) pairs.push(v.psf.filter((x) => x !== null));
  for (const [lo, hi] of pairs) {
    assert.ok(lo > 0);
    if (hi !== undefined) assert.ok(lo <= hi);
  }
});

test('budgetBand matches the lead form bands', () => {
  assert.deepEqual([10000, 20000, 49999, 50000, 99999, 100000].map(budgetBand),
    ['Below $20k', '$20k - $50k', '$20k - $50k', '$50k - $100k', '$50k - $100k', 'Above $100k']);
});
