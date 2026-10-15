import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Use a scratch folder so the test does not depend on which real logo files are in public/.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cred-logos-'));
process.env.CREDENTIAL_LOGO_DIR = dir;
const { credentialBadges } = await import('../lib/credentials.js');
const iso = new Date().toISOString().slice(0, 10);
const verified = { hdb_licence_no: 'HB1234', hdb_verified_value: 'HB1234', hdb_verified_at: iso, casetrust: 'casetrust', casetrust_verified_value: 'casetrust', casetrust_verified_at: iso };

test('credential logos show only on verified badges and only when the file exists', () => {
  const made = [];
  try {
    assert.ok(!/badge-logo/.test(credentialBadges(verified)), 'no logo file, no logo');
    for (const f of ['hdb.svg', 'casetrust.svg']) { const file = path.join(dir, f); fs.writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'); made.push(file); }
    const html = credentialBadges(verified);
    assert.equal((html.match(/badge-logo/g) || []).length, 2, 'both logos on verified badges');
    const declared = credentialBadges({ hdb_licence_no: 'HB1234', casetrust: 'casetrust' });
    assert.ok(!/badge-logo/.test(declared), 'self-declared badges stay text-only');
  } finally { made.forEach((f) => fs.rmSync(f, { force: true })); }
});

test('the bundled HDB logo file is a real, reasonably small image', () => {
  const f = path.join(process.cwd(), 'public', 'images', 'credentials', 'hdb.png');
  if (!fs.existsSync(f)) return;
  const size = fs.statSync(f).size;
  assert.ok(size > 2000 && size < 150000, `unexpected logo size ${size}`);
  assert.equal(fs.readFileSync(f).subarray(1, 4).toString(), 'PNG');
});
