// Business categories: trades and landed specialists are kept out of the designer directory and only
// receive enquiries for their own category. Runs against a scratch database.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'layered-cat-')), 'app.db');
const { db } = await import('../db.js');
const { matchLead } = await import('../routes/public.js');
const { CATEGORIES, TRADES, LANDED_PROS, validCategory, landedEstimate, LANDED_COSTS } = await import('../content/trades.js');

const add = (slug, category, types = '') => db.prepare("INSERT INTO businesses (slug, company_name, email, password_hash, property_types, category) VALUES (?, ?, ?, 'x', ?, ?)")
  .run(slug, slug, `${slug}@t.sg`, types, category);
add('designer-a', 'interior-design', 'HDB,Condo');
add('designer-b', 'interior-design', 'Landed');
add('lights-a', 'lighting');
add('arch-a', 'architect');
add('arch-b', 'architect');
add('arch-c', 'architect');
add('eng-a', 'qp-engineer');
add('builder-a', 'landed-builder');

const slugs = (rows) => rows.map((r) => r.slug).sort();

test('existing businesses default to interior design', () => {
  db.prepare("INSERT INTO businesses (slug, company_name, email, password_hash) VALUES ('old', 'old', 'old@t.sg', 'x')").run();
  assert.equal(db.prepare("SELECT category FROM businesses WHERE slug = 'old'").get().category, 'interior-design');
  db.prepare("DELETE FROM businesses WHERE slug = 'old'").run();
});

test('designer briefs only reach interior designers, matching property type first', () => {
  assert.deepEqual(slugs(matchLead('interior-design', 'HDB')), ['designer-a']);
  assert.deepEqual(slugs(matchLead('interior-design', 'Commercial')), ['designer-a', 'designer-b']);
});

test('trade requests only reach that trade', () => {
  assert.deepEqual(slugs(matchLead('lighting', 'HDB')), ['lights-a']);
  assert.deepEqual(matchLead('movers', ''), []);
});

test('landed briefs reach up to two of each landed specialist and no designers', () => {
  const s = slugs(matchLead('landed', 'Landed'));
  assert.equal(s.filter((x) => x.startsWith('arch-')).length, 2);
  assert.ok(s.includes('eng-a') && s.includes('builder-a'));
  assert.ok(!s.some((x) => x.startsWith('designer-')));
});

test('category list is consistent', () => {
  const all = CATEGORIES.map((c) => c.slug);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.length, 1 + LANDED_PROS.length + TRADES.length);
  assert.equal(validCategory('lighting'), 'lighting');
  assert.equal(validCategory('<script>'), 'interior-design');
  for (const t of TRADES) {
    assert.ok(t.description.length >= 120 && t.description.length <= 160, `${t.slug} description ${t.description.length}`);
    assert.ok((t.title + ' | Layered').length <= 60, `${t.slug} title`);
  }
});

test('landed estimate adds fees and extras to construction', () => {
  const r = landedEstimate({ scope: 'rebuild', type: 'terrace', spec: 'mid', gfa: 3000 }, LANDED_COSTS);
  assert.deepEqual(r.build, [280 * 3000, 330 * 3000]);
  assert.equal(Math.round(r.fees[0]), Math.round(r.build[0] * 0.07));
  assert.deepEqual(r.extras, [25000, 60000]);
  assert.equal(landedEstimate({ scope: 'aa', gfa: 1000 }, LANDED_COSTS).build[1], 300000);
  assert.equal(landedEstimate({ scope: 'rebuild', type: 'castle', spec: 'mid', gfa: 3000 }, LANDED_COSTS).ok, false);
  assert.equal(landedEstimate({ scope: 'aa', gfa: 10 }, LANDED_COSTS).ok, false);
});
