// Boots the real server on a scratch database and walks the main pages as a visitor and as a firm. Catches the kind of
// bug unit tests miss: a template that references a column the query never selected, a route that throws, a 500.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3299;
const BASE = `http://127.0.0.1:${PORT}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'layered-smoke-'));
const env = { ...process.env, PORT: String(PORT), DB_PATH: path.join(TMP, 'app.db'), UPLOAD_DIR: path.join(TMP, 'uploads'), ADMIN_EMAILS: 'admin@smoke.test', NODE_ENV: 'test' };
let server;
let cookie = '';

async function waitUp() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(BASE + '/'); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('server did not start');
}
const get = (p, withCookie = false) => fetch(BASE + p, { redirect: 'manual', headers: withCookie ? { cookie } : {} });

before(async () => {
  spawnSync(process.execPath, ['scripts/seed.js'], { env });
  spawnSync(process.execPath, ['scripts/seed-blog.js'], { env });
  server = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  await waitUp();
  const res = await fetch(BASE + '/login', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=contact%40warmhaus.example&password=password123' });
  cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  assert.ok(cookie.includes('session='), 'login should set a session cookie');
  await fetch(BASE + '/leads', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=Smoke+Tester&email=smoke%40home.test&property_type=HDB&message=Hello' });
});

after(() => { if (server) server.kill(); fs.rmSync(TMP, { recursive: true, force: true }); });

test('public pages return 200', async () => {
  for (const p of ['/', '/designers', '/designers/warmhaus-living', '/blog', '/blog/qanvast-alternative-singapore', '/guides', '/guides/renovation-checklist-singapore', '/tools/renovation-cost-calculator', '/tools/renovation-cost-estimator', '/tools/room-planner', '/services', '/services/lighting', '/services/electrician', '/landed', '/planner.js', '/about', '/privacy', '/terms', '/compare?d=warmhaus-living,northgate-design-studio', '/login', '/signup', '/forgot', '/sitemap.xml', '/robots.txt']) {
    const r = await get(p);
    assert.equal(r.status, 200, `${p} -> ${r.status}`);
  }
});

test('firm dashboard pages and the lead detail page render', async () => {
  for (const p of ['/dashboard', '/dashboard/leads', '/dashboard/projects', '/dashboard/profile', '/dashboard/articles', '/dashboard/articles/new']) {
    const r = await get(p, true);
    assert.equal(r.status, 200, `${p} -> ${r.status}`);
  }
  const list = await (await get('/dashboard/leads', true)).text();
  const href = /href="(\/dashboard\/leads\/\d+)"/.exec(list);
  assert.ok(href, 'the firm should have received the enquiry');
  const detail = await get(href[1], true);
  assert.equal(detail.status, 200, 'lead detail page');
  assert.match(await detail.text(), /Update status/);
});

test('admin-only pages refuse a normal firm', async () => {
  for (const p of ['/dashboard/blog', '/dashboard/verification', '/dashboard/reviews']) {
    assert.equal((await get(p, true)).status, 403, p);
  }
});

test('private pages redirect visitors to login', async () => {
  const r = await get('/dashboard');
  assert.equal(r.status, 302);
});
