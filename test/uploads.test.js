import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeImage, MAX_IMAGE_BYTES } from '../lib/body.js';

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

test('real images with matching extensions are accepted', () => {
  assert.ok(isSafeImage('a.jpg', jpeg));
  assert.ok(isSafeImage('A.JPEG', jpeg));
  assert.ok(isSafeImage('a.png', png));
  assert.ok(isSafeImage('a.webp', webp));
});

test('SVG, HTML and mismatched files are rejected', () => {
  assert.equal(isSafeImage('x.svg', svg), false);
  assert.equal(isSafeImage('x.html', svg), false);
  assert.equal(isSafeImage('x.jpg', svg), false);        // script renamed to .jpg
  assert.equal(isSafeImage('x.png', jpeg), false);       // wrong signature for extension
  assert.equal(isSafeImage('noext', jpeg), false);
});

test('oversized files are rejected', () => {
  assert.equal(isSafeImage('big.jpg', Buffer.concat([jpeg, Buffer.alloc(MAX_IMAGE_BYTES)])), false);
});
