// lib/ratelimit.js — small in-memory sliding-window limiter for the public POST endpoints that can be
// abused (login guessing, signup/lead/review spam). State lives in this process only: fine for a single
// instance, and a restart simply resets the counters.

const HOUR = 60 * 60 * 1000;
export const RULES = [
  { name: 'login', test: (m, p) => m === 'POST' && p === '/login', max: 10, windowMs: 15 * 60 * 1000 },
  { name: 'signup', test: (m, p) => m === 'POST' && p === '/signup', max: 5, windowMs: HOUR },
  { name: 'lead', test: (m, p) => m === 'POST' && p === '/leads', max: 5, windowMs: HOUR },
  { name: 'review', test: (m, p) => m === 'POST' && /^\/review\/[0-9a-f]+$/.test(p), max: 10, windowMs: HOUR },
];

const hits = new Map(); // `${rule}|${ip}` -> [timestamps]

// Behind a proxy (Render) the last X-Forwarded-For entry is the one the proxy added; earlier entries
// can be spoofed by the client.
export function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Returns null if allowed, or { retryAfter } in seconds if the request should be refused.
export function check(method, path, ip, now = Date.now()) {
  const rule = RULES.find((r) => r.test(method, path));
  if (!rule) return null;
  const key = `${rule.name}|${ip}`;
  const recent = (hits.get(key) || []).filter((t) => now - t < rule.windowMs);
  if (recent.length >= rule.max) {
    hits.set(key, recent);
    return { retryAfter: Math.max(1, Math.ceil((recent[0] + rule.windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  return null;
}

export function reset() { hits.clear(); }

// Drop stale keys so the map cannot grow without bound.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, list] of hits) {
    const rule = RULES.find((r) => r.name === key.split('|')[0]);
    if (!list.some((t) => now - t < rule.windowMs)) hits.delete(key);
  }
}, 10 * 60 * 1000);
sweeper.unref();
