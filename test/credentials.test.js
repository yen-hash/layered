import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedOn, isAnyVerified, credentialBadges, credentialsPanel, normaliseHdbLicence, normaliseCaseTrust } from '../lib/credentials.js';

const NOW = Date.parse('2026-10-04T12:00:00Z');
const firm = (o = {}) => ({
  hdb_licence_no: 'HB-24-01234', hdb_verified_value: 'HB-24-01234', hdb_verified_at: '2026-09-20 08:00:00',
  casetrust: 'casetrust_gold', casetrust_verified_value: 'casetrust_gold', casetrust_verified_at: '2026-09-21 09:30:00',
  ...o,
});

test('a matching, recent check is verified and reports its date', () => {
  assert.equal(verifiedOn(firm(), 'hdb', NOW), '2026-09-20');
  assert.equal(verifiedOn(firm(), 'casetrust', NOW), '2026-09-21');
});

test('changing the number or tier after the check voids the mark', () => {
  assert.equal(verifiedOn(firm({ hdb_licence_no: 'HB-24-99999' }), 'hdb', NOW), '');
  assert.equal(verifiedOn(firm({ casetrust: 'casetrust' }), 'casetrust', NOW), '');
});

test('removing the credential removes the mark', () => {
  assert.equal(verifiedOn(firm({ hdb_licence_no: '' }), 'hdb', NOW), '');
  assert.equal(verifiedOn(firm({ casetrust: '' }), 'casetrust', NOW), '');
});

test('a check older than 365 days has lapsed, one just inside has not', () => {
  assert.equal(verifiedOn(firm({ hdb_verified_at: '2025-10-05 00:00:00' }), 'hdb', NOW), '2025-10-05');
  assert.equal(verifiedOn(firm({ hdb_verified_at: '2025-10-03 00:00:00' }), 'hdb', NOW), '');
});

test('missing, malformed or future-dated checks are never verified', () => {
  assert.equal(verifiedOn(firm({ hdb_verified_at: '' }), 'hdb', NOW), '');
  assert.equal(verifiedOn(firm({ hdb_verified_value: '' }), 'hdb', NOW), '');
  assert.equal(verifiedOn(firm({ hdb_verified_at: 'not a date' }), 'hdb', NOW), '');
  assert.equal(verifiedOn(firm({ hdb_verified_at: '2027-01-01 00:00:00' }), 'hdb', NOW), '');
  assert.equal(isAnyVerified({ hdb_licence_no: 'X1', casetrust: '' }), false);
});

test('badges and panel say exactly what was checked, and escape firm-supplied text', () => {
  const real = Date.now();
  const recent = new Date(real - 5 * 86400000).toISOString().replace('T', ' ').slice(0, 19);
  const both = firm({ hdb_verified_at: recent, casetrust_verified_at: recent });
  assert.match(credentialBadges(both), /badge-verified/);
  assert.match(credentialsPanel(both), /Checked by Layered/);

  const unverified = firm({ hdb_verified_value: '', casetrust_verified_value: '' });
  assert.doesNotMatch(credentialBadges(unverified), /badge-verified/);
  assert.match(credentialsPanel(unverified), /Self-declared by the firm and not verified/);

  const mixed = firm({ hdb_verified_at: recent, casetrust_verified_value: '' });
  assert.match(credentialsPanel(mixed), /Items marked verified/);

  const hostile = credentialsPanel(firm({ hdb_licence_no: '"><script>x</script>', hdb_verified_value: '' }));
  assert.ok(!hostile.includes('<script>'));
});

test('licence input is normalised and junk is rejected', () => {
  assert.deepEqual(normaliseHdbLicence('  hb-24-01234 '), { value: 'HB-24-01234' });
  assert.ok(normaliseHdbLicence('<script>').error);
  assert.deepEqual(normaliseHdbLicence(''), { value: '' });
  assert.equal(normaliseCaseTrust('platinum'), '');
  assert.equal(normaliseCaseTrust('casetrust_rcma'), 'casetrust_rcma');
});
