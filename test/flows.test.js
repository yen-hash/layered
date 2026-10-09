// End-to-end write flows against the real server on a scratch database: signup, profile, portfolio, articles,
// credential verification, reviews, password reset and the blog editor. Complements smoke.test.js (read paths).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 3298;
const BASE = `http://127.0.0.1:${PORT}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'layered-flows-'));
const env = { ...process.env, PORT: String(PORT), DB_PATH: path.join(TMP, 'app.db'), UPLOAD_DIR: path.join(TMP, 'uploads'), ADMIN_EMAILS: 'admin@flows.test', NODE_ENV: 'test' };
const LOG = path.join(process.cwd(), 'data', 'notifications.log');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const tag = Date.now().toString(36);
const firmEmail = `firm-${tag}@flows.test`;
const homeEmail = `home-${tag}@flows.test`;
let server;
let firm = '';
let admin = '';

const form = (obj) => new URLSearchParams(obj).toString();
async function waitUp() {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(BASE + '/')).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('server did not start');
}
const cookieOf = (res) => (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
const req = (method, p, { cookie = '', body, headers = {} } = {}) => fetch(BASE + p, { method, body, redirect: 'manual', headers: { ...(cookie ? { cookie } : {}), ...headers } });
const post = (p, cookie, obj) => req('POST', p, { cookie, body: form(obj), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
const loc = (res) => decodeURIComponent(res.headers.get('location') || '');
const lastInLog = (re, needle) => {
  const text = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8') : '';
  const blocks = text.split(/\n(?=\[\d{4}-)/).filter((b) => !needle || b.includes(needle));
  const m = [...blocks.join('\n').matchAll(re)].pop();
  return m && m[1];
};

before(async () => {
  spawnSync(process.execPath, ['scripts/seed.js'], { env });
  server = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  await waitUp();
  const f = await post('/signup', '', { company_name: `Flow Studio ${tag}`, contact_name: 'Flo', email: firmEmail, password: 'Passw0rd!flow', phone: '91234567', property_types: 'HDB', styles: 'Minimalist' });
  firm = cookieOf(f);
  const a = await post('/signup', '', { company_name: `Admin Studio ${tag}`, email: 'admin@flows.test', password: 'Passw0rd!admin' });
  admin = cookieOf(a);
  assert.ok(firm.includes('session=') && admin.includes('session='), 'signups should log in');
});
after(() => { if (server) server.kill(); fs.rmSync(TMP, { recursive: true, force: true }); });

test('profile saves with credentials', async () => {
  const fd = new FormData();
  fd.set('company_name', `Flow Studio ${tag}`); fd.set('bio', 'We design homes.'); fd.set('hdb_licence_no', 'HB12345678'); fd.set('casetrust', 'casetrust');
  fd.append('property_types', 'HDB');
  const r = await req('POST', '/dashboard/profile', { cookie: firm, body: fd });
  assert.equal(r.status, 302);
  assert.match(loc(r), /Profile updated/);
});

test('portfolio: add, edit and delete a project with photos', async () => {
  const fd = new FormData();
  fd.set('title', 'Flow BTO'); fd.set('rights', 'on'); fd.set('photo_credit', 'Photo: Flow');
  fd.append('photos', new Blob([PNG], { type: 'image/png' }), 'a.png');
  fd.append('photos', new Blob([PNG], { type: 'image/png' }), 'b.png');
  const add = await req('POST', '/dashboard/projects', { cookie: firm, body: fd });
  assert.match(loc(add), /Project added/);
  const list = await (await req('GET', '/dashboard/projects', { cookie: firm })).text();
  const id = /\/dashboard\/projects\/(\d+)\/edit/.exec(list)[1];
  assert.match(list, /2 photos/);
  assert.equal((await req('GET', `/dashboard/projects/${id}/edit`, { cookie: firm })).status, 200);

  const edit = new FormData();
  edit.set('title', 'Flow BTO edited'); edit.set('description', 'Edited description');
  const upd = await req('POST', `/dashboard/projects/${id}`, { cookie: firm, body: edit });
  assert.match(loc(upd), /Project updated/);
  const profile = await (await req('GET', `/designers/flow-studio-${tag}`)).text();
  assert.match(profile, /Flow BTO edited/);

  const rejected = new FormData();
  rejected.set('title', 'Bad file'); rejected.set('rights', 'on');
  rejected.append('photos', new Blob(['<svg onload=alert(1)>'], { type: 'image/svg+xml' }), 'x.svg');
  assert.match(loc(await req('POST', '/dashboard/projects', { cookie: firm, body: rejected })), /not accepted/);

  const del = await post(`/dashboard/projects/${id}/delete`, firm, {});
  assert.match(loc(del), /Project removed/);
});

test('articles: draft, submit, admin approves, public page', async () => {
  const body = Array(130).fill('Ask for a written scope and compare itemised quotes carefully.').join(' ');
  const save = await post('/dashboard/articles/save', firm, { title: `Flow article ${tag}`, excerpt: 'A practical note from our studio on hiring well.', body, intent: 'submit' });
  assert.match(loc(save), /Submitted/);
  const queue = await (await req('GET', '/dashboard/blog', { cookie: admin })).text();
  const id = new RegExp(`/dashboard/articles/(\\d+)/approve`).exec(queue)[1];
  assert.match(loc(await post(`/dashboard/articles/${id}/approve`, admin, {})), /published/i);
  const slug = `flow-article-${tag}`;
  const page = await req('GET', `/blog/${slug}`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Written by a listed firm/);
});

test('admin verifies a credential and it shows publicly', async () => {
  const list = await (await req('GET', '/dashboard/verification', { cookie: admin })).text();
  const m = new RegExp(`/dashboard/verification/(\\d+)/hdb/verify`).exec(list);
  assert.ok(m, 'verification page should list the firm with an HDB licence');
  assert.equal((await post(`/dashboard/verification/${m[1]}/hdb/verify`, admin, {})).status, 302);
  const page = await (await req('GET', `/designers/flow-studio-${tag}`)).text();
  assert.match(page, /badge-verified/);
});

test('reviews: enquiry, won, invite, one-time review, moderation, public', async () => {
  const lead = await post('/leads', '', { name: 'Home Owner', email: homeEmail, property_type: 'HDB', message: 'Need help with a flat.' });
  assert.equal(lead.status, 302);
  const leads = await (await req('GET', '/dashboard/leads', { cookie: firm })).text();
  const matchId = /\/dashboard\/leads\/(\d+)"/.exec(leads)[1];
  assert.equal((await req('GET', `/dashboard/leads/${matchId}`, { cookie: firm })).status, 200);
  assert.match(loc(await post(`/dashboard/leads/${matchId}/review-invite`, firm, {})), /marked|won/i, 'cannot invite before won');
  await post(`/dashboard/leads/${matchId}/status`, firm, { status: 'won' });
  assert.match(loc(await post(`/dashboard/leads/${matchId}/review-invite`, firm, {})), /emailed/);
  const token = lastInLog(/\/review\/([0-9a-f]{48})/g, homeEmail);
  assert.ok(token, 'invite link should be logged for the enquiry email');
  assert.equal((await req('GET', `/review/${token}`)).status, 200);
  const sub = await post(`/review/${token}`, '', { rating: '5', body: 'Lovely team, finished on time and left everything tidy.' });
  assert.equal(sub.status, 200);
  assert.equal((await post(`/review/${token}`, '', { rating: '1', body: 'Trying to submit again right now please.' })).status, 302, 'second use is refused');
  const pubBefore = await (await req('GET', `/designers/flow-studio-${tag}`)).text();
  assert.ok(!/finished on time and left everything tidy/.test(pubBefore), 'hidden until published');
  const queue = await (await req('GET', '/dashboard/reviews', { cookie: admin })).text();
  const rid = /\/dashboard\/reviews\/(\d+)\/publish/.exec(queue)[1];
  await post(`/dashboard/reviews/${rid}/publish`, admin, {});
  const pub = await (await req('GET', `/designers/flow-studio-${tag}`)).text();
  assert.match(pub, /finished on time and left everything tidy/);
});

test('password reset: link works once and the new password logs in', async () => {
  assert.equal((await post('/forgot', '', { email: firmEmail })).status, 302);
  const token = lastInLog(/\/reset\/([0-9a-f]{64})/g, firmEmail);
  assert.ok(token, 'reset link should be logged');
  assert.equal((await req('GET', `/reset/${token}`)).status, 200);
  assert.equal((await post(`/reset/${token}`, '', { password: 'NewPassw0rd!x', confirm: 'NewPassw0rd!x' })).status, 302);
  assert.equal((await req('GET', `/reset/${token}`)).status, 410);
  const bad = await post('/login', '', { email: firmEmail, password: 'Passw0rd!flow' });
  assert.match(loc(bad), /Incorrect/);
  const ok = await post('/login', '', { email: firmEmail, password: 'NewPassw0rd!x' });
  assert.equal(new URL(ok.headers.get('location'), BASE).pathname, '/dashboard');
});

test('admin reset link: admin only, works once, new password logs in', async () => {
  assert.equal((await req('GET', '/dashboard/accounts', { cookie: firm })).status, 403);
  const list = await (await req('GET', '/dashboard/accounts', { cookie: admin })).text();
  const row = list.split('<tr>').find((r) => r.includes(firmEmail));
  const id = Number(row.match(/\/dashboard\/accounts\/(\d+)\/reset/)[1]);
  assert.ok(id > 0, 'firm row should have a reset form');
  assert.equal((await post(`/dashboard/accounts/${id}/reset`, firm, {})).status, 403);
  const made = await post(`/dashboard/accounts/${id}/reset`, admin, {});
  assert.equal(made.status, 200);
  const token = (await made.text()).match(/\/reset\/([0-9a-f]{64})/)[1];
  assert.equal((await req('GET', `/reset/${token}`)).status, 200);
  assert.equal((await post(`/reset/${token}`, '', { password: 'AdminSetPassw0rd!', confirm: 'AdminSetPassw0rd!' })).status, 302);
  assert.equal((await req('GET', `/reset/${token}`)).status, 410);
  const ok = await post('/login', '', { email: firmEmail, password: 'AdminSetPassw0rd!' });
  assert.equal(new URL(ok.headers.get('location'), BASE).pathname, '/dashboard');
  assert.equal((await post('/dashboard/accounts/999999/reset', admin, {})).status, 302);
});

test('blog editor: admin writes and publishes, non-admin is refused', async () => {
  assert.equal((await req('GET', '/dashboard/blog/new', { cookie: admin })).status, 200);
  const save = await post('/dashboard/blog/save', admin, { title: `Editor post ${tag}`, category: 'Guides', body: '## Heading\n\nSome text for the post.', excerpt: 'Short intro', intent: 'publish' });
  assert.equal(save.status, 302);
  assert.equal((await req('GET', `/blog/editor-post-${tag}`)).status, 200);
  const refused = await post('/dashboard/blog/save', firm, { title: 'Nope', body: 'x', intent: 'publish' });
  assert.equal(refused.status, 403);
});

test('masked leads: free plan hides contact details until admin unlocks', async () => {
  const accts = await (await req('GET', '/dashboard/accounts', { cookie: admin })).text();
  const row = accts.split('<tr>').find((r) => r.includes(`Flow Studio ${tag}`));
  const id = /\/dashboard\/accounts\/(\d+)\/access/.exec(row)[1];
  assert.match(loc(await post(`/dashboard/accounts/${id}/access`, admin, { plan: 'free', trial_ends: '2020-01-01' })), /saved/i);
  const secret = `masked-${tag}@flows.test`;
  const sent = await post('/leads', '', { name: 'Mask Tester', email: secret, phone: '81234567', property_type: 'HDB', business: `flow-studio-${tag}`, message: `Please WhatsApp 8123 4567 or email ${secret}` });
  assert.match(loc(sent), /unlock it/);
  const list = await (await req('GET', '/dashboard/leads', { cookie: firm })).text();
  const matchId = [...list.matchAll(/\/dashboard\/leads\/(\d+)"/g)].map((m) => m[1]).pop();
  const page = await (await req('GET', `/dashboard/leads/${matchId}`, { cookie: firm })).text();
  assert.ok(!page.includes(secret) && !page.includes('81234567') && !page.includes('8123 4567') && !page.includes('Mask Tester'), 'no contact details in the page');
  assert.match(page, /Contact details are hidden/);
  assert.ok(!fs.readFileSync(LOG, 'utf8').includes(secret), 'notification email must not carry the contact details');
  assert.match(loc(await post(`/dashboard/leads/${matchId}/review-invite`, firm, {})), /unlock/i);
  await post(`/dashboard/accounts/${id}/leads/${matchId}/unlock`, admin, {});
  const open = await (await req('GET', `/dashboard/leads/${matchId}`, { cookie: firm })).text();
  assert.ok(open.includes(secret), 'unlocked lead shows the contact details');
});

test('admin can delete a duplicate firm; name must match; self-delete refused', async () => {
  const dupEmail = `dup-${tag}@flows.test`;
  const dupName = `Dup Studio ${tag}`;
  await post('/signup', '', { company_name: dupName, email: dupEmail, password: 'Passw0rd!dup1' });
  const accts = await (await req('GET', '/dashboard/accounts', { cookie: admin })).text();
  const row = accts.split('<tr>').find((r) => r.includes(dupName));
  const id = /\/dashboard\/accounts\/(\d+)\/delete/.exec(row)[1];
  const slug = /\/designers\/([a-z0-9-]+)"/.exec(row)[1];
  assert.equal((await req('GET', `/designers/${slug}`)).status, 200);
  assert.equal((await req('GET', `/dashboard/accounts/${id}/delete`, { cookie: firm })).status, 403, 'non-admin refused');
  assert.match(loc(await post(`/dashboard/accounts/${id}/delete`, admin, { confirm: 'wrong' })), /did not match/);
  assert.equal((await req('GET', `/designers/${slug}`)).status, 200, 'still there after a wrong name');
  assert.match(loc(await post(`/dashboard/accounts/${id}/delete`, admin, { confirm: dupName })), /was deleted/);
  assert.equal((await req('GET', `/designers/${slug}`)).status, 404);
  const adminRow = accts.split('<tr>').find((r) => r.includes(`Admin Studio ${tag}`));
  assert.ok(!/\/delete"/.test(adminRow), 'no delete link for your own account');
});
