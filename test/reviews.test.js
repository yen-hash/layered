import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReview, summarise, reviewSchema, reviewsSection, firstName, newToken, MIN_REVIEWS_FOR_SCHEMA } from '../lib/reviews.js';

const rv = (rating, body = 'Great work from start to finish.') => ({ rating, body, reviewer_name: 'Sam', submitted_at: '2026-10-01 10:00:00' });

test('parseReview validates rating and length', () => {
  assert.equal(parseReview({ rating: '5', body: 'Really good communication throughout.' }).ok, true);
  assert.equal(parseReview({ rating: '0', body: 'x'.repeat(30) }).ok, false);
  assert.equal(parseReview({ rating: '6', body: 'x'.repeat(30) }).ok, false);
  assert.equal(parseReview({ rating: 'abc', body: 'x'.repeat(30) }).ok, false);
  assert.equal(parseReview({ rating: '4', body: 'too short' }).ok, false);
  assert.equal(parseReview({ rating: '4', body: 'x'.repeat(1501) }).ok, false);
});

test('summarise averages to one decimal', () => {
  assert.deepEqual(summarise([]), { count: 0, average: 0 });
  assert.deepEqual(summarise([rv(5), rv(4), rv(4)]), { count: 3, average: 4.3 });
});

test('schema only appears with enough reviews', () => {
  assert.equal(reviewSchema([rv(5), rv(5)]), null);
  const s = reviewSchema([rv(5), rv(4), rv(3)]);
  assert.equal(MIN_REVIEWS_FOR_SCHEMA, 3);
  assert.equal(s.aggregateRating.reviewCount, 3);
  assert.equal(s.review.length, 3);
});

test('review text is escaped when rendered', () => {
  const html = reviewsSection({}, [rv(5, '<script>alert(1)</script> lovely team and fast.')]);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('first name only, and tokens are 48 hex chars and unique', () => {
  assert.equal(firstName('Mei Ling Tan'), 'Mei');
  assert.equal(firstName(''), 'A homeowner');
  const a = newToken(), b = newToken();
  assert.match(a, /^[0-9a-f]{48}$/);
  assert.notEqual(a, b);
});
