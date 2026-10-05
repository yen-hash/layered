// routes/reviews.js — invite (firm), write (homeowner, by emailed token), moderate (admin).
import { db } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { abs } from '../lib/seo.js';
import { sendEmail } from '../lib/notify.js';
import { newToken, firstName, parseReview, MAX_BODY } from '../lib/reviews.js';
import { dashLayout } from './dashboard.js';

const redirect = (res, to) => { res.writeHead(302, { Location: to }); res.end(); };
const flashTo = (path, msg) => `${path}?ok=${encodeURIComponent(msg)}`;

// Firm: ask Layered to email a review invitation for a won enquiry.
export async function reviewInvite(req, res, ctx, matchId) {
  const row = db.prepare(`SELECT l.*, lm.status, lm.id AS match_id, lm.lead_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.id = ? AND lm.business_id = ?`).get(matchId, ctx.business.id);
  const back = `/dashboard/leads/${matchId}`;
  if (!row) return redirect(res, '/dashboard/leads');
  if (row.status !== 'won') return redirect(res, `${back}?err=${encodeURIComponent('Mark the enquiry as won before inviting a review.')}`);
  const exists = db.prepare('SELECT id FROM reviews WHERE lead_id = ? AND business_id = ?').get(row.lead_id, ctx.business.id);
  if (exists) return redirect(res, `${back}?err=${encodeURIComponent('A review invitation was already sent for this enquiry.')}`);
  const token = newToken();
  db.prepare('INSERT INTO reviews (lead_id, business_id, token) VALUES (?, ?, ?)').run(row.lead_id, ctx.business.id, token);
  const link = abs(ctx.site, `/review/${token}`);
  await sendEmail({
    to: row.email,
    subject: `How was your renovation with ${ctx.business.company_name}?`,
    text: [
      `Hi ${firstName(row.name)},`, '',
      `You enquired about a renovation through Layered, and ${ctx.business.company_name} has asked us to invite you to share your experience.`,
      `Your review helps other homeowners. It takes about two minutes:`, '', link, '',
      `Only you can use this link, and it works once. We read every review before it is published, and we publish honest reviews whether they are positive or not.`,
      `If this wasn't you, ignore this email.`,
    ].join('\n'),
  });
  redirect(res, flashTo(back, 'Review invitation emailed to the homeowner.'));
}

function page(title, inner, ctx) {
  return layout({ title, noindex: true, body: `<section class="wrap narrow" style="padding:40px 0;">${inner}</section>`, business: ctx.business, flash: ctx.flash, site: ctx.site });
}

function loadByToken(token) {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  return db.prepare(`SELECT r.*, b.company_name, b.slug, l.name AS lead_name FROM reviews r JOIN businesses b ON b.id = r.business_id JOIN leads l ON l.id = r.lead_id WHERE r.token = ?`).get(token) || null;
}

function formHtml(r, values = {}, error = '') {
  return `
  <h1>Review ${esc(r.company_name)}</h1>
  <p class="muted">Hi ${esc(firstName(r.lead_name))}, thanks for taking two minutes. We read every review before it is published and show it under your first name only.</p>
  ${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/review/${esc(r.token)}">
    <fieldset class="field"><legend>Your rating</legend>
      <div class="chip-group">${[5, 4, 3, 2, 1].map((n) => `<label><input type="radio" name="rating" value="${n}" ${String(values.rating) === String(n) ? 'checked' : ''} required> ${n} ${'★'.repeat(n)}</label>`).join('')}</div>
    </fieldset>
    <div class="field"><label for="body">Your experience</label>
      <textarea id="body" name="body" rows="7" maxlength="${MAX_BODY}" required placeholder="What was the process like? Communication, timeline, workmanship, anything that surprised you.">${esc(values.body || '')}</textarea></div>
    <button class="btn" type="submit">Submit review</button>
  </form>`;
}

export async function reviewFormPage(req, res, ctx, token) {
  const r = loadByToken(token);
  if (!r) { res.statusCode = 404; return res.end(page('Review link not found', '<h1>Link not found</h1><p class="muted">This review link is not valid.</p>', ctx)); }
  if (r.status !== 'invited') return res.end(page('Review received', `<h1>Thank you</h1><p>Your review of ${esc(r.company_name)} has already been submitted${r.status === 'pending' ? ' and is waiting for a quick read before it appears' : ''}.</p>`, ctx));
  res.end(page(`Review ${r.company_name}`, formHtml(r), ctx));
}

export async function reviewSubmit(req, res, ctx, token, fields) {
  const r = loadByToken(token);
  if (!r) { res.statusCode = 404; return res.end(page('Review link not found', '<h1>Link not found</h1>', ctx)); }
  if (r.status !== 'invited') return redirect(res, `/review/${token}`);
  const parsed = parseReview(fields);
  if (!parsed.ok) { res.statusCode = 400; return res.end(page(`Review ${r.company_name}`, formHtml(r, fields, parsed.error), ctx)); }
  // The status guard makes the submission single-use even under a double click.
  const done = db.prepare(`UPDATE reviews SET status = 'pending', rating = ?, body = ?, reviewer_name = ?, submitted_at = datetime('now') WHERE id = ? AND status = 'invited'`)
    .run(parsed.rating, parsed.body, firstName(r.lead_name), r.id);
  if (!done.changes) return redirect(res, `/review/${token}`);
  res.end(page('Review received', `<h1>Thank you</h1><p>Your review of ${esc(r.company_name)} has been received. We read every review before it is published.</p><p><a href="/designers/${esc(r.slug)}">Back to ${esc(r.company_name)}</a></p>`, ctx));
}

// Admin moderation queue.
const forbidden = (res, ctx) => { res.statusCode = 403; res.end(dashLayout('/dashboard/reviews', '<h1>Not allowed</h1><p class="muted">Review moderation is limited to admins.</p>', ctx)); };

export async function reviewsAdmin(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const rows = db.prepare(`SELECT r.*, b.company_name, l.email AS lead_email FROM reviews r JOIN businesses b ON b.id = r.business_id JOIN leads l ON l.id = r.lead_id WHERE r.status != 'invited' ORDER BY (r.status = 'pending') DESC, r.submitted_at DESC`).all();
  const waiting = db.prepare("SELECT COUNT(*) c FROM reviews WHERE status = 'invited'").get().c;
  const inner = `
    <div class="head-row"><h1>Reviews</h1></div>
    <div class="dash-card"><p>Publish honest reviews, positive or negative. Reject only spam, abuse, personal data, or reviews that are clearly not about the firm. ${waiting} invitation${waiting === 1 ? '' : 's'} sent and not yet answered.</p></div>
    ${rows.length ? rows.map((r) => `
    <div class="dash-card">
      <p><strong>${esc(r.company_name)}</strong> · ${r.rating}/5 · ${esc(r.reviewer_name)} <span class="muted small">(${esc(r.lead_email)})</span>
        <span class="status-pill status-${r.status === 'published' ? 'won' : r.status === 'rejected' ? 'lost' : 'new'}">${esc(r.status)}</span></p>
      <p>${esc(r.body).replace(/\n/g, '<br>')}</p>
      <form method="post" action="/dashboard/reviews/${r.id}/publish" class="inline"><button class="btn btn-sm" type="submit">${r.status === 'published' ? 'Keep published' : 'Publish'}</button></form>
      <form method="post" action="/dashboard/reviews/${r.id}/reject" class="inline"><button class="btn btn-sm btn-outline" type="submit">Reject</button></form>
    </div>`).join('') : '<div class="dash-card"><p class="muted">No submitted reviews yet.</p></div>'}`;
  res.end(dashLayout('/dashboard/reviews', inner, ctx));
}

export async function reviewModerate(req, res, ctx, id, action) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const status = action === 'publish' ? 'published' : 'rejected';
  db.prepare("UPDATE reviews SET status = ?, moderated_at = datetime('now') WHERE id = ? AND status != 'invited'").run(status, id);
  redirect(res, flashTo('/dashboard/reviews', status === 'published' ? 'Review published.' : 'Review rejected.'));
}
