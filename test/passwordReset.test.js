import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { ensureTable, createResetToken, findValidToken, consumeToken, passwordProblem, hashToken, RESET_TTL_MINUTES } from '../lib/passwordReset.js';

function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE businesses (id INTEGER PRIMARY KEY, email TEXT)');
  db.exec("INSERT INTO businesses (id, email) VALUES (1, 'a@b.co'), (2, 'c@d.co')");
  ensureTable(db);
  return db;
}

test('token is valid once, then spent', () => {
  const db = freshDb();
  const raw = createResetToken(db, 1);
  const row = findValidToken(db, raw);
  assert.equal(row.business_id, 1);
  assert.equal(consumeToken(db, row.id), true);
  assert.equal(consumeToken(db, row.id), false);
  assert.equal(findValidToken(db, raw), null);
});

test('only a hash is stored', () => {
  const db = freshDb();
  const raw = createResetToken(db, 1);
  const stored = db.prepare('SELECT token_hash FROM password_resets').get().token_hash;
  assert.notEqual(stored, raw);
  assert.equal(stored, hashToken(raw));
});

test('expires after the TTL', () => {
  const db = freshDb();
  const t0 = Date.parse('2026-10-05T00:00:00Z');
  const raw = createResetToken(db, 1, t0);
  assert.ok(findValidToken(db, raw, t0 + (RESET_TTL_MINUTES - 1) * 60000));
  assert.equal(findValidToken(db, raw, t0 + (RESET_TTL_MINUTES + 1) * 60000), null);
});

test('a new request cancels the older link', () => {
  const db = freshDb();
  const first = createResetToken(db, 1);
  const second = createResetToken(db, 1);
  assert.equal(findValidToken(db, first), null);
  assert.ok(findValidToken(db, second));
});

test('bad tokens and other accounts do not match', () => {
  const db = freshDb();
  const raw = createResetToken(db, 1);
  assert.equal(findValidToken(db, 'nope'), null);
  assert.equal(findValidToken(db, 'a'.repeat(64)), null);
  assert.equal(findValidToken(db, raw).business_id, 1);
});

test('password rules', () => {
  assert.match(passwordProblem('short', 'short'), /at least 8/);
  assert.match(passwordProblem('longenough1', 'different1'), /do not match/);
  assert.equal(passwordProblem('longenough1', 'longenough1'), '');
});
