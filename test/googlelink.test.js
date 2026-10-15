import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseGoogleReviewsUrl } from '../lib/googleLink.js';

test('google reviews link validation', () => {
  assert.equal(normaliseGoogleReviewsUrl('').value, '');
  assert.ok(normaliseGoogleReviewsUrl('https://maps.app.goo.gl/xyz').value.startsWith('https://maps.app.goo.gl/'));
  assert.ok(normaliseGoogleReviewsUrl('g.page/r/abc/review').value.startsWith('https://g.page/'));
  assert.ok(normaliseGoogleReviewsUrl('https://www.google.com/maps/place/Foo').value);
  for (const bad of ['http://maps.app.goo.gl/x', 'https://google.com.evil.com/maps', 'https://www.google.com/imgres?x', 'https://example.com', 'javascript:alert(1)', 'not a url']) {
    assert.ok(normaliseGoogleReviewsUrl(bad).error, bad);
  }
});
