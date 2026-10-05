import test from 'node:test';
import assert from 'node:assert/strict';
import { check, reset, clientIp } from '../lib/ratelimit.js';

test('login is limited to 10 attempts per window per IP', () => {
  reset();
  const t0 = 1_000_000;
  for (let i = 0; i < 10; i++) assert.equal(check('POST', '/login', '1.1.1.1', t0 + i), null);
  const blocked = check('POST', '/login', '1.1.1.1', t0 + 11);
  assert.ok(blocked && blocked.retryAfter > 0);
  assert.equal(check('POST', '/login', '2.2.2.2', t0 + 12), null); // other IP unaffected
});

test('window slides: allowed again after it passes', () => {
  reset();
  const t0 = 5_000_000;
  for (let i = 0; i < 5; i++) check('POST', '/leads', '3.3.3.3', t0);
  assert.ok(check('POST', '/leads', '3.3.3.3', t0 + 1000));
  assert.equal(check('POST', '/leads', '3.3.3.3', t0 + 61 * 60 * 1000), null);
});

test('only abusable POSTs are limited', () => {
  reset();
  for (let i = 0; i < 50; i++) assert.equal(check('GET', '/login', '4.4.4.4'), null);
  for (let i = 0; i < 50; i++) assert.equal(check('POST', '/dashboard/leads/1/status', '4.4.4.4'), null);
  assert.equal(check('POST', '/review/' + 'a'.repeat(48), '4.4.4.4'), null);
});

test('client IP uses the last forwarded entry', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 5.5.5.5' }, socket: { remoteAddress: '10.0.0.1' } }), '5.5.5.5');
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '10.0.0.1' } }), '10.0.0.1');
});
