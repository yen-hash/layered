// Where Carpenters' lead emails go: HOUSE_LEAD_EMAIL if it is set and valid, otherwise the account's login email. Other
// firms always use their own. The sender is a fake Resend endpoint: nothing is sent.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { leadEmailFor, sendLeadEmail } from '../lib/notify.js';

const house = { house_firm: 1, email: 'login@house.test', notify_email: 1, company_name: 'Carpenters' };
const other = { house_firm: 0, email: 'login@other.test', notify_email: 1, company_name: 'Other' };
const realFetch = globalThis.fetch;
afterEach(() => { delete process.env.HOUSE_LEAD_EMAIL; delete process.env.RESEND_API_KEY; globalThis.fetch = realFetch; });

test('not set: the login email, as before', () => {
  assert.equal(leadEmailFor(house), 'login@house.test');
});

test('set: Carpenters uses it, other firms never do', () => {
  process.env.HOUSE_LEAD_EMAIL = ' leads@house.test ';
  assert.equal(leadEmailFor(house), 'leads@house.test');
  assert.equal(leadEmailFor(other), 'login@other.test');
});

test('not a single valid address: fall back to the login email, so no lead is lost', () => {
  for (const v of ['', 'leads', 'a@b', 'a@b.test, c@d.test', 'a@b.test\nBcc: x@y.test']) {
    process.env.HOUSE_LEAD_EMAIL = v;
    assert.equal(leadEmailFor(house), 'login@house.test', JSON.stringify(v));
  }
});

async function send(business) {
  let sent;
  process.env.RESEND_API_KEY = 'test';
  globalThis.fetch = async (url, o) => { sent = JSON.parse(o.body); return { ok: true }; };
  await sendLeadEmail(business, { id: 1, name: 'Jane', email: 'j@t.test', property_type: 'HDB' });
  return sent;
}

test('the email really goes to that address, with a subject the enquiry sweep looks for', async () => {
  process.env.HOUSE_LEAD_EMAIL = 'leads@house.test';
  const mail = await send(house);
  assert.equal(mail.to, 'leads@house.test');
  assert.match(mail.subject, /^New Enquiry \(Layered\): Jane/);
  const theirs = await send(other);
  assert.equal(theirs.to, 'login@other.test');
  assert.match(theirs.subject, /^New lead: Jane/);
});

test('email alerts switched off: nothing is sent', async () => {
  process.env.HOUSE_LEAD_EMAIL = 'leads@house.test';
  assert.equal(await send({ ...house, notify_email: 0 }), undefined);
});
