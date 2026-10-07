// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_TYPES, CATALOG, LAYOUTS, planQuantities } from '../content/planner.js';
import { ITEMS } from '../content/itemised.js';

const q = (plan) => planQuantities(plan, ROOM_TYPES, CATALOG);

test('dry floor area excludes wet rooms and converts to square feet', () => {
  const r = q({ rooms: [{ type: 'living', w: 5, h: 4 }, { type: 'bedroom', w: 3, h: 3 }, { type: 'bathroom', w: 2, h: 2 }, { type: 'kitchen', w: 3, h: 3 }], items: [] });
  assert.equal(r.totalM2, 42);
  assert.equal(r.dryM2, 29);
  assert.equal(r.drySqft, Math.round(29 * 10.7639));
  assert.equal(r.qty.vinyl, r.drySqft);
  assert.equal(r.bathrooms, 1);
});

test('built-ins add foot runs by their long side, rounded up; beds count', () => {
  const r = q({ rooms: [], items: [{ kind: 'wardrobe', w: 0.6, h: 1.8 }, { kind: 'wardrobe', w: 1.2, h: 0.6 }, { kind: 'platformBed', w: 2, h: 2.2 }, { kind: 'platformBed', w: 2, h: 2.2 }, { kind: 'sofa', w: 2, h: 1 }] });
  assert.equal(r.qty.wardrobe, Math.ceil(3 * 3.28084));
  assert.equal(r.qty.platformBed, 2);
  assert.equal(r.qty.sofa, undefined);
});

test('bad input is ignored rather than crashing', () => {
  const r = q({ rooms: [{ type: 'pool', w: 5, h: 5 }, { type: 'living', w: -1, h: 4 }, { type: 'living', w: 'x', h: 2 }], items: [{ kind: 'rocket', w: 9, h: 9 }] });
  assert.deepEqual([r.totalM2, r.rooms, Object.keys(r.qty).length], [0, 0, 0]);
});

test('every catalogue quantity key exists in the itemised estimator', () => {
  const keys = new Set(ITEMS.flatMap((g) => g.items.map((i) => i.key)));
  for (const [k, c] of Object.entries(CATALOG)) if (c.qty) assert.ok(keys.has(c.qty), k);
  assert.ok(keys.has('vinyl') && keys.has('bathFittings'));
});

test('starter layouts use known room types and items, and give plausible sizes', () => {
  for (const [k, l] of Object.entries(LAYOUTS)) {
    for (const r of l.rooms) assert.ok(ROOM_TYPES[r.type], `${k}: ${r.type}`);
    for (const i of l.items) assert.ok(CATALOG[i.kind], `${k}: ${i.kind}`);
    if (k === 'blank') continue;
    const r = q(l);
    assert.ok(r.totalM2 > 40 && r.totalM2 < 130, `${k}: ${r.totalM2} m²`);
    assert.ok(r.bathrooms >= 2);
  }
});
