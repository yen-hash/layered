import test from 'node:test';
import assert from 'node:assert/strict';
import { associateLabels } from '../lib/render.js';

test('labels get matching ids', () => {
  const out = associateLabels('<div><label>Email</label><input type="email" name="email" required></div>');
  const id = out.match(/<input[^>]* id="([^"]+)"/)[1];
  assert.ok(out.includes(`<label for="${id}">Email</label>`));
});

test('existing ids are reused and labels with for are untouched', () => {
  assert.equal(associateLabels('<label>X</label><input id="a" name="b">'), '<label for="a">X</label><input id="a" name="b">');
  const already = '<label for="q">Q</label><input id="q">';
  assert.equal(associateLabels(already), already);
});

test('ids are unique across repeated field names', () => {
  const out = associateLabels('<label>A</label><input name="x"><label>B</label><input name="x">');
  const ids = [...out.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 2);
});
