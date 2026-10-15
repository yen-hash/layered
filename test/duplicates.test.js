import test from 'node:test';
import assert from 'node:assert/strict';
import { nameKey, phoneKey, duplicateFlags } from '../lib/duplicates.js';

test('name keys ignore generic words and punctuation', () => {
  assert.equal(nameKey('Mu Design Studio Pte. Ltd.'), 'mu');
  assert.equal(nameKey('MU Interior'), 'mu');
  assert.equal(nameKey('Mu Zen Studio'), 'mu zen');
  assert.notEqual(nameKey('Mu Zen Studio'), nameKey('Mu Design Studio'));
  assert.equal(nameKey('Studio Design'), 'studio design', 'a name of only generic words is kept');
});

test('phone keys use the last 8 digits', () => {
  assert.equal(phoneKey('+65 9123 4567'), '91234567');
  assert.equal(phoneKey('91234567'), '91234567');
  assert.equal(phoneKey('123'), '');
});

test('duplicate flags group same name or same phone, and leave others alone', () => {
  const f = duplicateFlags([
    { id: 1, company_name: 'Mu Design Studio', phone: '' },
    { id: 2, company_name: 'MU Interior Pte Ltd', phone: '' },
    { id: 3, company_name: 'Alpha Home', phone: '+65 8888 1111' },
    { id: 4, company_name: 'Beta Home', phone: '88881111' },
    { id: 5, company_name: 'Carpenters', phone: '' },
  ]);
  assert.deepEqual([...f.keys()].sort(), [1, 2, 3, 4]);
  assert.ok(f.get(1)[0].includes('MU Interior'));
});
