// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, PRESETS, CONTINGENCY, HOMES, itemisedEstimate } from '../content/itemised.js';

const run = (home, qty) => itemisedEstimate({ home, qty }, ITEMS, CONTINGENCY);

test('lines multiply quantity by the unit rate and add up', () => {
  const r = run('hdb4', { vinyl: 100, wardrobe: 10 });
  assert.equal(r.ok, true);
  assert.deepEqual([r.low, r.high], [100 * 4.5 + 10 * 200, 100 * 9 + 10 * 360]);
  assert.equal(r.suggestedLow, Math.round(r.low * 1.10));
  assert.equal(r.suggestedHigh, Math.round(r.high * 1.15));
});

test('whole-home items use the rate for the chosen home', () => {
  assert.deepEqual([run('hdb3', { rewire: 1 }).low, run('hdb5', { rewire: 1 }).high], [1500, 4500]);
});

test('items without a rate for the home are skipped, not priced at zero', () => {
  const r = run('condo', { rewire: 1, paint: 1 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.skipped, ['Full rewiring of the home']);
  assert.equal(r.lines.length, 1);
});

test('empty, negative and silly quantities are handled', () => {
  assert.equal(run('hdb4', {}).ok, false);
  assert.equal(run('hdb4', { vinyl: -5 }).ok, false);
  assert.equal(run('hdb4', { vinyl: 'abc' }).ok, false);
  assert.equal(run('hdb4', { vinyl: 1e9 }).ok, false);
  assert.equal(run('mansion', { vinyl: 10 }).ok, false);
});

test('every preset only uses real item keys and prices without skips (except condo rewiring)', () => {
  const keys = new Set(ITEMS.flatMap((g) => g.items.map((i) => i.key)));
  for (const cond of Object.keys(PRESETS)) {
    for (const home of Object.keys(HOMES)) {
      const p = PRESETS[cond][home];
      for (const k of Object.keys(p)) assert.ok(keys.has(k), `${cond}/${home}: unknown key ${k}`);
      const r = run(home, p);
      assert.equal(r.ok, true);
      assert.ok(r.low > 5000 && r.high < 150000, `${cond}/${home} out of range`);
      assert.ok(r.low < r.high);
    }
  }
});

test('every item has a valid unit rate', () => {
  for (const g of ITEMS) for (const it of g.items) {
    const ranges = it.rangeBy ? Object.values(it.rangeBy) : [it.range];
    for (const [lo, hi] of ranges) assert.ok(lo > 0 && hi >= lo, it.key);
  }
});
