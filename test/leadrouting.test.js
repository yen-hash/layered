// Carpenters' 24-hour head start on general interior design enquiries, and firm approval. Runs against a scratch
// database. Every routing rule has a test.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'layered-route-'));
process.env.DB_PATH = path.join(TMP, 'app.db');
const { db } = await import('../db.js');
const R = await import('../lib/leadRouting.js');
const { canSeeContact, hasAccountAccess } = await import('../lib/leadAccess.js');
const { matchLead, submitLeadRoute } = await import('../routes/public.js');
const { leadStatusUpdate } = await import('../routes/dashboard.js');

const addFirm = (slug, { types = 'HDB,Condo', category = 'interior-design', approved = 1, house = 0, featured = 0, trial = '2030-01-01 00:00:00' } = {}) =>
  Number(db.prepare("INSERT INTO businesses (slug, company_name, email, password_hash, property_types, category, approved, house_firm, featured, trial_ends_at, notify_email) VALUES (?, ?, ?, 'x', ?, ?, ?, ?, ?, ?, 0)")
    .run(slug, slug, `${slug}@t.sg`, types, category, approved, house, featured, trial).lastInsertRowid);
const firm = (id) => db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
const leadRow = (id) => db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
const lastLead = () => db.prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 1').get();
const got = (id) => db.prepare('SELECT b.slug FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = ? ORDER BY lm.id').all(id).map((r) => r.slug);
const mark = (id, slug, status) => db.prepare('UPDATE lead_matches SET status = ? WHERE lead_id = ? AND business_id = (SELECT id FROM businesses WHERE slug = ?)').run(status, id, slug);
const later = (h) => new Date(Date.now() + h * 3600e3);
const age = (id, hours) => db.prepare("UPDATE leads SET created_at = datetime('now', ?) WHERE id = ?").run(`-${hours} hours`, id);

async function submit(fields) {
  const res = { writeHead(code, h) { this.code = code; this.loc = decodeURIComponent(h.Location); }, end() {} };
  await submitLeadRoute({}, res, {}, { name: 'Home Owner', email: 'h@o.sg', phone: '91234567', property_type: 'HDB', category: 'interior-design', ...fields });
  return res;
}

let house;
beforeEach(() => {
  db.exec('DELETE FROM lead_matches; DELETE FROM leads; DELETE FROM businesses;');
  house = addFirm('carpenters', { types: 'HDB,Condo,Landed,Commercial', house: 1, featured: 1, trial: '2020-01-01 00:00:00' });
  addFirm('rival-a'); addFirm('rival-b'); addFirm('rival-c');
  addFirm('landed-only', { types: 'Landed' });
  addFirm('pending-firm', { approved: 0, featured: 1 });
});

test('general design enquiry goes to Carpenters only, with full details even when its trial has ended', async () => {
  const res = await submit({ share_ok: '1' });
  const l = lastLead();
  assert.deepEqual(got(l.id), ['carpenters']);
  assert.ok(db.prepare('SELECT unlocked_at FROM lead_matches WHERE lead_id = ?').get(l.id).unlocked_at);
  assert.ok(canSeeContact(firm(house), { unlocked_at: '' }));
  assert.equal(l.share_ok, 1);
  assert.ok(l.share_ok_at);
  const gap = new Date(l.release_at.replace(' ', 'T') + 'Z') - new Date(l.created_at.replace(' ', 'T') + 'Z');
  assert.ok(Math.abs(gap - 24 * 3600e3) < 5000, 'released 24 hours after submission');
  assert.match(res.loc, /Carpenters/i);
  assert.match(res.loc, /ga_event=lead/);
});

test('nothing is released before 24 hours', async () => {
  await submit({ share_ok: '1' });
  assert.equal(R.releaseDue(db, later(23.9)), 0);
  assert.deepEqual(got(lastLead().id), ['carpenters']);
});

test('ticked: after 24 hours at most 2 other approved matching firms get it, once only', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  assert.equal(R.releaseDue(db, later(24.1)), 1);
  const firms = got(id);
  assert.equal(firms.length, 3);
  assert.ok(firms.slice(1).every((s) => /^rival-/.test(s)), firms.join());
  assert.equal(R.releaseDue(db, later(30)), 0);
  assert.equal(R.releaseLead(db, id, { now: later(30), early: true }), 0);
  assert.equal(got(id).length, 3);
});

test('a firm without a plan or trial gets a masked copy on release', async () => {
  db.exec("UPDATE businesses SET trial_ends_at = '2020-01-01 00:00:00' WHERE slug LIKE 'rival-%'");
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  R.releaseDue(db, later(25));
  const rows = db.prepare("SELECT lm.unlocked_at FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = ? AND b.slug LIKE 'rival-%'").all(id);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.unlocked_at === ''));
});

test('not ticked: never shared, not even when Carpenters declines', async () => {
  await submit({});
  const { id } = lastLead();
  assert.equal(R.releaseDue(db, later(100)), 0);
  mark(id, 'carpenters', 'declined');
  assert.equal(R.releaseLead(db, id, { early: true }), 0);
  assert.deepEqual(got(id), ['carpenters']);
});

test('only the exact form value counts as consent', async () => {
  for (const v of ['0', 'false', '', 'yes please']) {
    await submit({ share_ok: v });
    assert.equal(lastLead().share_ok, 0, JSON.stringify(v));
  }
});

test('won: never released', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  mark(id, 'carpenters', 'won');
  assert.equal(R.releaseDue(db, later(25)), 0);
  assert.deepEqual(got(id), ['carpenters']);
});

const act = (business, matchId, status) => {
  const res = { writeHead(c, h) { this.loc = decodeURIComponent(h.Location); }, end() {} };
  return leadStatusUpdate({}, res, { business }, matchId, { status }).then(() => res);
};
const matchId = (leadId, slug) => db.prepare('SELECT lm.id FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = ? AND b.slug = ?').get(leadId, slug).id;

test('"not for us" releases at once if ticked, and only Carpenters can use it', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  await act(firm(house), matchId(id, 'carpenters'), 'declined');
  assert.equal(got(id).length, 3);
  const rival = got(id)[1];
  await act(db.prepare('SELECT * FROM businesses WHERE slug = ?').get(rival), matchId(id, rival), 'declined');
  assert.notEqual(db.prepare('SELECT status FROM lead_matches WHERE id = ?').get(matchId(id, rival)).status, 'declined');
});

test('another firm cannot decline (and so release) a lead that is not its own', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  const rival = db.prepare("SELECT * FROM businesses WHERE slug = 'rival-a'").get();
  await act({ ...rival, house_firm: 1 }, matchId(id, 'carpenters'), 'declined');
  assert.deepEqual(got(id), ['carpenters']);
});

test('homeowner asks us to stop: never released', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  R.stopSharing(db, id);
  assert.equal(R.releaseDue(db, later(25)), 0);
  assert.equal(R.releaseLead(db, id, { early: true }), 0);
});

test('an enquiry from one firm\'s profile goes to that firm only, even if share_ok is posted', async () => {
  await submit({ business: 'rival-b', share_ok: '1' });
  const l = lastLead();
  assert.deepEqual(got(l.id), ['rival-b']);
  assert.equal(l.share_ok, 0);
  await submit({ business: 'carpenters', share_ok: '1' });
  assert.equal(R.releaseDue(db, later(48)), 0);
  assert.deepEqual(got(lastLead().id), ['carpenters']);
});

test('an enquiry naming a pending or unknown firm is refused, not spread to others', async () => {
  for (const business of ['pending-firm', 'no-such-firm']) {
    const res = await submit({ business, share_ok: '1' });
    assert.match(res.loc, /no longer listed/);
  }
  assert.equal(db.prepare('SELECT COUNT(*) n FROM leads').get().n, 0);
});

test('trades: at most 3 approved firms, no head start', async () => {
  for (const s of ['t1', 't2', 't3', 't4']) addFirm(s, { category: 'lighting' });
  addFirm('t-pending', { category: 'lighting', approved: 0, featured: 1 });
  await submit({ category: 'lighting' });
  const firms = got(lastLead().id);
  assert.equal(firms.length, 3);
  assert.ok(!firms.includes('t-pending') && !firms.includes('carpenters'));
  assert.equal(lastLead().release_at, null);
});

test('landed: unchanged at two per specialist, pending firms left out', () => {
  for (const s of ['a1', 'a2', 'a3']) addFirm(s, { category: 'architect' });
  addFirm('a-pending', { category: 'architect', approved: 0, featured: 1 });
  const firms = matchLead('landed', 'Landed').map((f) => f.slug);
  assert.equal(firms.length, 2);
  assert.ok(!firms.includes('a-pending'));
});

test('only firms that take that property type receive a released lead', async () => {
  await submit({ share_ok: '1', property_type: 'Landed' });
  const { id } = lastLead();
  R.releaseDue(db, later(25));
  assert.deepEqual(got(id), ['carpenters', 'landed-only']);
});

test('no suitable firm: still marked released, so it does not surface months later', async () => {
  await submit({ share_ok: '1', property_type: 'Commercial' });
  const { id } = lastLead();
  R.releaseDue(db, later(25));
  assert.ok(leadRow(id).released_at);
  addFirm('new-commercial', { types: 'Commercial' });
  R.releaseDue(db, later(26));
  assert.deepEqual(got(id), ['carpenters']);
});

test('a lead more than 7 days old is not released (server was off)', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  age(id, 24 * 8);
  assert.equal(R.releaseDue(db, later(0)), 0);
  assert.deepEqual(got(id), ['carpenters']);
});

test('old enquiries (no consent recorded) are never released', () => {
  const id = Number(db.prepare("INSERT INTO leads (name, email, property_type) VALUES ('Old', 'old@x.sg', 'HDB')").run().lastInsertRowid);
  db.prepare('INSERT INTO lead_matches (lead_id, business_id) VALUES (?, ?)').run(id, house);
  assert.equal(R.releaseDue(db, later(48)), 0);
  assert.equal(R.releaseLead(db, id, { early: true }), 0);
});

test('a wiped enquiry is never released', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  db.prepare("UPDATE leads SET purged_at = datetime('now') WHERE id = ?").run(id);
  assert.equal(R.releaseDue(db, later(25)), 0);
});

test('Carpenters missing: the lead is held, sent to nobody, then delivered when it is back', async () => {
  db.prepare('UPDATE businesses SET house_firm = 0 WHERE id = ?').run(house);
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  assert.deepEqual(got(id), []);
  assert.equal(leadRow(id).held, 1);
  assert.equal(R.releaseDue(db, later(48)), 0);
  db.prepare('UPDATE businesses SET house_firm = 1 WHERE id = ?').run(house);
  assert.equal(R.deliverHeld(db, new Date()), 1);
  assert.deepEqual(got(id), ['carpenters']);
  assert.equal(leadRow(id).held, 0);
  assert.ok(leadRow(id).release_at);
  assert.equal(R.deliverHeld(db, new Date()), 0);
});

test('Carpenters account deleted after delivery: the lead is not released', async () => {
  await submit({ share_ok: '1' });
  const { id } = lastLead();
  db.prepare('DELETE FROM businesses WHERE id = ?').run(house);
  assert.equal(R.releaseDue(db, later(25)), 0);
  assert.deepEqual(got(id), []);
});

test('a pending firm cannot see contact details, even of leads it already received', () => {
  const p = firm(db.prepare("SELECT id FROM businesses WHERE slug = 'pending-firm'").get().id);
  assert.equal(hasAccountAccess(p), false);
  assert.equal(canSeeContact(p, { unlocked_at: '2026-01-01 00:00:00' }), false);
  assert.equal(hasAccountAccess({ ...p, approved: 1 }), true);
});

test('migration: existing firms stay approved, the junk listing becomes pending, Carpenters becomes first', () => {
  const file = path.join(TMP, 'old.db');
  const old = new DatabaseSync(file);
  old.exec(`CREATE TABLE businesses (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, company_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, phone TEXT, contact_name TEXT, property_types TEXT DEFAULT '', styles TEXT DEFAULT '', service_areas TEXT DEFAULT '', bio TEXT DEFAULT '', logo_url TEXT DEFAULT '', notify_email INTEGER DEFAULT 1, notify_sms INTEGER DEFAULT 0, notify_phone TEXT, featured INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    INSERT INTO businesses (slug, company_name, email, password_hash) VALUES ('carpenters','Carpenters','c@t','x'), ('mu','MU','m@t','x'), ('pyeyripvsr','pyeyripvsr yjodtuqylu','p@t','x');`);
  old.close();
  const run = () => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', "import {db} from './db.js'; console.log(JSON.stringify(db.prepare('SELECT slug, approved, house_firm FROM businesses ORDER BY id').all()))"], { env: { ...process.env, DB_PATH: file }, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
  };
  assert.deepEqual(run(), [{ slug: 'carpenters', approved: 1, house_firm: 1 }, { slug: 'mu', approved: 1, house_firm: 0 }, { slug: 'pyeyripvsr', approved: 0, house_firm: 0 }]);
  const again = new DatabaseSync(file);
  again.exec("UPDATE businesses SET approved = 1 WHERE slug = 'pyeyripvsr'");
  again.close();
  assert.equal(run()[2].approved, 1, 'an admin decision survives the next start');
});
