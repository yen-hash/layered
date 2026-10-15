import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { credentialBadges } from '../lib/credentials.js';

const dir = path.join(process.cwd(), 'public', 'images', 'credentials');
const iso = new Date().toISOString().slice(0, 10);
const verified = { hdb_licence_no: 'HB1234', hdb_verified_value: 'HB1234', hdb_verified_at: iso, casetrust: 'casetrust', casetrust_verified_value: 'casetrust', casetrust_verified_at: iso };

test('credential logos show only on verified badges and only when the file exists', () => {
  const made = [];
  try {
    assert.ok(!/badge-logo/.test(credentialBadges(verified)), 'no logo file, no logo');
    fs.mkdirSync(dir, { recursive: true });
    for (const f of ['hdb.svg', 'casetrust.svg']) { const file = path.join(dir, f); if (!fs.existsSync(file)) { fs.writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'); made.push(file); } }
    const html = credentialBadges(verified);
    assert.equal((html.match(/badge-logo/g) || []).length, 2, 'both logos on verified badges');
    const declared = credentialBadges({ hdb_licence_no: 'HB1234', casetrust: 'casetrust' });
    assert.ok(!/badge-logo/.test(declared), 'self-declared badges stay text-only');
  } finally { made.forEach((f) => fs.rmSync(f, { force: true })); }
});
