// lib/auth.js — password hashing (scrypt) and signed session cookies (HMAC), stdlib only.
import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me-in-production';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
}

export function createSessionToken(businessId) {
  const payload = JSON.stringify({ id: businessId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const b64 = Buffer.from(payload).toString('base64url');
  return `${b64}.${sign(b64)}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  if (sign(b64) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload.id;
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  const existing = res.getHeader('Set-Cookie');
  const cookieStr = parts.join('; ');
  if (existing) {
    res.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, cookieStr] : [existing, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', cookieStr);
  }
}

export function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
}
