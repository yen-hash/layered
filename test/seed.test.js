// The seed script: sample firms are optional (SEED_DEMO=0), but the real Carpenters listing always exists
// and is added even when other businesses are already in the database.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const run = (dbPath, env = {}) => spawnSync(process.execPath, ['scripts/seed.js'], { env: { ...process.env, DB_PATH: dbPath, NODE_ENV: 'test', ...env }, encoding: 'utf8' });
const names = (dbPath) => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "import {db} from './db.js'; console.log(JSON.stringify(db.prepare('SELECT company_name FROM businesses ORDER BY id').all().map((r) => r.company_name)))"], { env: { ...process.env, DB_PATH: dbPath }, encoding: 'utf8' });
  return JSON.parse(r.stdout.trim().split('\n').pop());
};
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'layered-seed-')), 'app.db');

test('SEED_DEMO=0 still creates Carpenters but none of the sample firms', () => {
  const db = tmp();
  run(db, { SEED_DEMO: '0' });
  assert.deepEqual(names(db), ['Carpenters 匠']);
});

test('the default seed adds Carpenters and the sample firms, and re-running adds nothing', () => {
  const db = tmp();
  run(db);
  const first = names(db);
  assert.equal(first.length, 5);
  assert.ok(first.includes('Carpenters 匠'));
  run(db);
  assert.deepEqual(names(db), first);
});

test('Carpenters is added to a database that already has another business', () => {
  const db = tmp();
  spawnSync(process.execPath, ['--input-type=module', '-e', "import {db} from './db.js'; db.prepare(\"INSERT INTO businesses (slug, company_name, email, password_hash) VALUES ('x', 'X Firm', 'x@x.sg', 'h')\").run()"], { env: { ...process.env, DB_PATH: db } });
  run(db, { SEED_DEMO: '0' });
  assert.deepEqual(names(db), ['X Firm', 'Carpenters 匠']);
});
