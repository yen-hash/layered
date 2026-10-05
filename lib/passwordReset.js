// lib/passwordReset.js — single-use, expiring password reset tokens. Only a SHA-256 hash of the token is stored,
// so a copy of the database cannot be used to take over an account.
import crypto from 'node:crypto';

export const RESET_TTL_MINUTES = 60;
export const MIN_PASSWORD = 8;

export const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

export function ensureTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
}

const sqlTime = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19);

// Creates a fresh token for the business (older unused ones stop working) and returns the raw token to email.
export function createResetToken(db, businessId, now = Date.now()) {
  const raw = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE password_resets SET used_at = ? WHERE business_id = ? AND used_at IS NULL').run(sqlTime(now), businessId);
  db.prepare('INSERT INTO password_resets (business_id, token_hash, expires_at) VALUES (?, ?, ?)')
    .run(businessId, hashToken(raw), sqlTime(now + RESET_TTL_MINUTES * 60 * 1000));
  return raw;
}

// Returns the reset row if the token is valid, unused and unexpired, else null. Does not consume it.
export function findValidToken(db, raw, now = Date.now()) {
  if (!/^[0-9a-f]{64}$/.test(String(raw))) return null;
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(hashToken(raw));
  if (!row || row.used_at || row.expires_at <= sqlTime(now)) return null;
  return row;
}

// Atomically marks the token used. Returns true only for the first caller.
export function consumeToken(db, id, now = Date.now()) {
  return db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ? AND used_at IS NULL').run(sqlTime(now), id).changes === 1;
}

export function passwordProblem(password, confirm) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) return `Choose a password of at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return 'The two passwords do not match.';
  return '';
}
