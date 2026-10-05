// lib/reviews.js — review rules and public rendering.
//
// What a published review means: the author is the person who submitted an enquiry through Layered that
// was routed to this firm, and the firm marked that enquiry "won" and asked Layered to invite them.
// The invitation link is emailed only to the address on the enquiry (the firm never sees the link), each
// enquiry can review each firm once, and an admin approves every review before it appears.
// Layered does not verify that the work was completed or its quality.
import crypto from 'node:crypto';
import { esc } from './render.js';

export const MIN_REVIEWS_FOR_SCHEMA = 3;
export const MAX_BODY = 1500;

export const newToken = () => crypto.randomBytes(24).toString('hex');

export function firstName(full) {
  const w = String(full || '').trim().split(/\s+/)[0] || '';
  return w.slice(0, 30) || 'A homeowner';
}

// Returns {ok:true, rating, body} or {ok:false, error}.
export function parseReview(fields) {
  const rating = Number.parseInt(fields.rating, 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'Please choose a rating from 1 to 5.' };
  const body = String(fields.body || '').replace(/\r\n/g, '\n').trim();
  if (body.length < 20) return { ok: false, error: 'Please write at least a couple of sentences (20 characters).' };
  if (body.length > MAX_BODY) return { ok: false, error: `Please keep your review under ${MAX_BODY} characters.` };
  return { ok: true, rating, body };
}

export function summarise(list) {
  const n = list.length;
  if (!n) return { count: 0, average: 0 };
  const sum = list.reduce((a, r) => a + r.rating, 0);
  return { count: n, average: Math.round((sum / n) * 10) / 10 };
}

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export function ratingBadge(sum) {
  if (!sum.count) return '';
  return `<span class="rating-badge" title="${sum.average} out of 5 from ${sum.count} review${sum.count === 1 ? '' : 's'} by homeowners who enquired through Layered"><span aria-hidden="true">★</span> ${sum.average} <span class="muted">(${sum.count})</span></span>`;
}

export function reviewsSection(b, list) {
  const sum = summarise(list);
  if (!sum.count) {
    return `<h2>Reviews</h2><p class="muted">No reviews yet. Layered only publishes reviews from homeowners who enquired through Layered, after an admin has read them.</p>`;
  }
  return `<h2>Reviews (${sum.count})</h2>
  <p class="rating-summary"><strong>${sum.average}</strong> out of 5 <span class="stars" aria-hidden="true">${stars(Math.round(sum.average))}</span></p>
  <p class="muted small">Written by homeowners who enquired through Layered and were invited to review by this firm. Layered reads every review before it appears but does not verify the work or its quality.</p>
  <ul class="review-list">${list.map((r) => `
    <li class="review">
      <div class="review-head"><span class="stars" role="img" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</span> <strong>${esc(r.reviewer_name)}</strong> <span class="muted small">${esc((r.submitted_at || '').slice(0, 10))}</span></div>
      <p>${esc(r.body).replace(/\n/g, '<br>')}</p>
    </li>`).join('')}</ul>`;
}

// Structured data only once there are enough reviews to be meaningful.
export function reviewSchema(list) {
  if (list.length < MIN_REVIEWS_FOR_SCHEMA) return null;
  const sum = summarise(list);
  return {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: sum.average, reviewCount: sum.count, bestRating: 5, worstRating: 1 },
    review: list.slice(0, 10).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewer_name },
      datePublished: (r.submitted_at || '').slice(0, 10),
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.body,
    })),
  };
}
