import test from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail, maskPhone, maskName, scrubMessage, maskLead, hasAccountAccess, canSeeContact, trialEnd } from '../lib/leadAccess.js';

test('masking hides contact details', () => {
  assert.equal(maskEmail('jane.tan@gmail.com'), 'j•••@g•••');
  assert.ok(!maskPhone('91234567').includes('9123'));
  assert.ok(maskPhone('91234567').endsWith('67'));
  assert.equal(maskName('Jane Mei Tan'), 'Jane T.');
  const m = scrubMessage('Call me on +65 9123 4567 or jane@x.com, see https://x.com/a');
  assert.ok(!/9123|jane@|https/.test(m));
});

test('masked lead leaks no contact details anywhere', () => {
  const l = maskLead({ id: 1, name: 'Jane Tan', email: 'jane@gmail.com', phone: '91234567', message: 'WhatsApp 9123 4567 please', property_type: 'HDB' });
  const blob = JSON.stringify(l);
  assert.ok(!/jane@gmail|91234567|9123 4567|Jane Tan/.test(blob));
  assert.equal(l.property_type, 'HDB');
});

test('access: paid, trial, expired, per-lead unlock', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  assert.ok(hasAccountAccess({ plan: 'paid', trial_ends_at: '2020-01-01 00:00:00' }, now));
  assert.ok(hasAccountAccess({ plan: 'free', trial_ends_at: '2027-01-01 00:00:00' }, now));
  const expired = { plan: 'free', trial_ends_at: '2026-01-01 00:00:00' };
  assert.ok(!hasAccountAccess(expired, now));
  assert.ok(!canSeeContact(expired, { unlocked_at: '' }, now));
  assert.ok(canSeeContact(expired, { unlocked_at: '2026-02-01 10:00:00' }, now));
  // No stored trial date: three months after the account was created.
  const fresh = { plan: 'free', trial_ends_at: '', created_at: '2026-10-01 00:00:00' };
  assert.equal(trialEnd(fresh).toISOString().slice(0, 10), '2027-01-01');
  assert.ok(!hasAccountAccess({ ...fresh, created_at: '2026-01-01 00:00:00' }, now));
});
