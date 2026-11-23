// The spam filter: junk is kept aside, real homeowners get through, and an admin can undo a mistake.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'layered-spam-')), 'app.db');
const { db } = await import('../db.js');
const { spamCheck } = await import('../lib/spam.js');
const R = await import('../lib/leadRouting.js');
const { submitLeadRoute, matchLead } = await import('../routes/public.js');

const ok = { name: 'Tan Wei Ling', email: 'a@b.sg', property_type: 'HDB', budget_range: '$50k - $100k' };
const s = (over, meta) => spamCheck({ ...ok, ...over }, meta);

test('real homeowners get through', () => {
  for (const message of [
    '', 'Hi, 4rm BTO Tengah key collection March. Need quote for whole house.', '4rm resale reno pls call me', 'Kitchen + 2 toilets only. Budget 25k',
    'I like the kitchen in the Bidadari home on your site.', 'I saw your website and would like a quote for my condo at Parc Esta.',
    'Floor plan here: https://drive.google.com/file/d/abc123 thanks', '你好，我想装修四房式组屋，请联系我', 'Saya nak renovate rumah, boleh bagi harga?',
    'Looking for airconditioning, refurbishment, waterproofing and undercounter lighting for a Tiong Bahru walkup.', 'Scandinavian or Japandi style, hacking of kitchen wall, rewiring',
    'My email is abc@gmail.com, whatsapp 91234567', 'Please call after 7pm. Budget is tight, ranking my options in order.',
  ]) assert.equal(s({ message }).spam, false, `${message}: ${s({ message }).why}`);
  for (const name of ["Siti Nur'aini", 'Ng', 'Kwek Shr Yng', 'Muthukumaraswamy', 'Krzysztof', 'O’Brien', '陈小明', 'Mr & Mrs Goh']) assert.equal(s({ name, message: 'Need a quote' }).spam, false, name);
  for (const name of ['John2', 'Ah Hock 88', 'Tan1234']) assert.equal(s({ name, message: 'Need a quote' }).spam, false, name);
  assert.equal(s({ property_type: '', budget_range: '' }).spam, false, 'nothing chosen');
  assert.equal(s({ property_type: 'Landed', budget_range: 'Above $2M' }, { isLanded: true }).spam, false, 'landed budgets');
  assert.equal(s({ message: 'Need a quote', shown: String(Date.now() - 1000) }).spam, false, 'fast but normal');
});

test('the kinds of junk already received are caught', () => {
  for (const [over, label] of [
    [{ message: 'Hello layeredsg.com, I noticed a few design-related issues on your website.' }, 'web design pitch'],
    [{ message: "List layeredsg.com in Google's Search Index so it shows in web search results" }, 'index pitch'],
    [{ message: 'Hello https://x.example I checked your website. Your ranking is not good on Google.' }, 'ranking pitch'],
    [{ message: 'Is your website getting the search visibility it deserves?' }, 'visibility pitch'],
    [{ message: 'There are lawful ways to send commercial communications through contact forms. SEO experts here.' }, 'form marketing'],
    [{ message: 'MEYJTJ819674MARETRYTR', name: 'MEYJTJ819674', shown: String(Date.now() - 500) }, 'code text'],
    [{ message: 'MERYTRH1342470MAERWETT', name: 'NATREGTEGH819674' }, 'code text and code name'],
    [{ message: 'Hello there! There are lawful ways to send commercial communications to businesses.' }, 'lawful ways pitch'],
    [{ message: 'Jfeuwgduwefhwqq fuhefyugewfhqwyfuewu uwqduiqwhfqefhwduhwfe layeredsg.com' }, 'gibberish and our address'],
    [{ message: 'Состояние пациента отслеживается на каждом этапе лечения' }, 'Russian'],
    [{ name: '1', message: '1', property_type: '1', budget_range: '1' }, 'scan'], [{ name: "1'" }, 'quote probe'], [{ property_type: 'Select one' }, 'placeholder'],
    [{ message: "x' or 1=1 --" }, 'SQL'], [{ hp_field: 'http://x' }, 'hidden field'],
  ]) assert.equal(s(over).spam, true, `${label}: score ${s(over).score} ${s(over).why}`);
});

const firm = (slug, category, house = 0) => Number(db.prepare("INSERT INTO businesses (slug, company_name, email, password_hash, property_types, category, house_firm, trial_ends_at, notify_email) VALUES (?, ?, ?, 'x', 'HDB', ?, ?, '2030-01-01 00:00:00', 0)").run(slug, slug, `${slug}@t.sg`, category, house).lastInsertRowid);
const got = (id) => db.prepare('SELECT b.slug FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = ?').all(id).map((r) => r.slug);
const last = () => db.prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 1').get();
async function submit(f) {
  const res = { writeHead(c, h) { this.loc = decodeURIComponent(h.Location); }, end() {} };
  await submitLeadRoute({}, res, { site: 'https://layeredsg.com' }, { ...ok, category: 'interior-design', ...f });
  return res;
}
beforeEach(() => {
  db.exec('DELETE FROM lead_matches; DELETE FROM leads; DELETE FROM businesses;');
  firm('carpenters', 'interior-design', 1); firm('rival', 'interior-design'); firm('lights', 'lighting');
});
const junk = { message: 'Hello layeredsg.com, we offer SEO and backlinks' };

test('junk reaches nobody, is kept, looks normal to the sender, and is never released', async () => {
  const res = await submit({ ...junk, share_ok: '1' });
  const l = last();
  assert.equal(l.spam, 1);
  assert.ok(l.spam_why);
  assert.deepEqual(got(l.id), []);
  assert.match(res.loc, /^\/\?ok=Thanks/);
  assert.ok(!/ga_event/.test(res.loc), 'not counted as a lead');
  assert.equal(R.releaseDue(db, new Date(Date.now() + 48 * 3600e3)), 0);
  assert.equal(R.deliverHeld(db), 0);
});

test('"not spam" sends it on exactly as it would have gone, once', async () => {
  await submit({ ...junk, share_ok: '1' });
  let l = last();
  assert.equal(R.notSpam(db, l.id, matchLead), true);
  assert.deepEqual(got(l.id), ['carpenters']);
  assert.ok(db.prepare('SELECT release_at FROM leads WHERE id = ?').get(l.id).release_at, 'the 24 hours start now');
  assert.equal(R.notSpam(db, l.id, matchLead), false);
  assert.equal(got(l.id).length, 1);
  await submit({ ...junk, business: 'rival' }); l = last();
  R.notSpam(db, l.id, matchLead);
  assert.deepEqual(got(l.id), ['rival'], 'one firm only');
  await submit({ ...junk, category: 'lighting' }); l = last();
  R.notSpam(db, l.id, matchLead);
  assert.deepEqual(got(l.id), ['lights']);
});

test('a good enquiry is untouched', async () => {
  const res = await submit({ message: '4 room BTO in Tengah' });
  assert.equal(last().spam, 0);
  assert.deepEqual(got(last().id), ['carpenters']);
  assert.match(res.loc, /ga_event=lead/);
});
