import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GA_MEASUREMENT_ID = 'G-TEST1234';
const { layout } = await import('../lib/render.js');

test('GA4 snippet reports lead and sign-up conversions once, with no personal data', () => {
  const html = layout({ title: 'T', body: '<p>x</p>', description: 'd', path: '/', site: 'https://layeredsg.com' });
  assert.match(html, /G-TEST1234/);
  assert.match(html, /generate_lead/);
  assert.match(html, /sign_up/);
  assert.match(html, /history\.replaceState/, 'parameters are removed so a refresh cannot double count');
  assert.ok(!/ga_(email|phone|name)/.test(html), 'only category and direct flag are reported');
});
