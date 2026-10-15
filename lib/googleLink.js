// lib/googleLink.js — an optional link from a firm's profile to its own Google reviews (no Google API, no ratings
// copied). Only Google's own hosts are accepted so the field cannot be used to link anywhere else.
import { esc } from './render.js';

const HOSTS = new Set(['maps.google.com', 'www.google.com', 'google.com', 'maps.app.goo.gl', 'goo.gl', 'g.page', 'search.google.com', 'share.google', 'www.google.com.sg', 'google.com.sg']);

// Returns { value } ('' to clear) or { error }.
export function normaliseGoogleReviewsUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return { value: '' };
  let u;
  try { u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); } catch { return { error: 'That Google reviews link does not look like a web address.' }; }
  if (u.protocol !== 'https:' || !HOSTS.has(u.hostname.toLowerCase()) || v.length > 500) {
    return { error: 'Use the link from your Google Maps listing (Share, then Copy link). It should start with https://maps.app.goo.gl, https://g.page or https://www.google.com/maps.' };
  }
  if (u.hostname.toLowerCase().replace(/^www\./, '') === 'google.com' && !u.pathname.startsWith('/maps') && !u.pathname.startsWith('/search')) {
    return { error: 'Use the link from your Google Maps listing (Share, then Copy link).' };
  }
  return { value: u.toString() };
}

export function googleReviewsLink(b) {
  if (!b.google_reviews_url) return '';
  return `<p class="google-reviews-link"><a class="btn btn-sm btn-outline" href="${esc(b.google_reviews_url)}" target="_blank" rel="noopener nofollow">Read ${esc(b.company_name)}'s reviews on Google</a> <span class="muted small">Opens Google Maps. These reviews are written on Google and are not read or checked by Layered.</span></p>`;
}
