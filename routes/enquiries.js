// routes/enquiries.js — admin-only: where each general interior design enquiry is (with Carpenters, shared, held), and a
// button to stop sharing when a homeowner asks. Names are shortened and contact details are not shown.
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { maskName } from '../lib/leadAccess.js';
import { notSpam, sharingState, stopSharing } from '../lib/leadRouting.js';
import { matchLead } from './public.js';
import { dashLayout } from './dashboard.js';

const forbidden = (res, ctx) => {
  res.statusCode = 403;
  res.end(dashLayout('/dashboard/enquiries', '<h1>Not allowed</h1><p class="muted">Enquiry tools are limited to admins.</p>', ctx));
};

export async function enquiriesPage(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const rows = db.prepare(`SELECT l.*, (SELECT GROUP_CONCAT(b.company_name, ', ') FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = l.id) AS firms
    FROM leads l WHERE l.category = 'interior-design' AND l.spam = 0 ORDER BY l.id DESC LIMIT 200`).all();
  const junk = db.prepare('SELECT * FROM leads WHERE spam = 1 ORDER BY id DESC LIMIT 100').all();
  const inner = `
    <div class="head-row"><h1>Enquiries</h1></div>
    <div class="dash-card">
      <p>General design enquiries go to Carpenters for 24 hours, then to up to 2 other firms only if the homeowner agreed. Use <strong>Stop sharing</strong> when a homeowner asks; it cannot recall an enquiry already shared.</p>
      ${rows.length ? `<table class="data-table"><thead><tr><th>Date (UTC)</th><th>Homeowner</th><th>Property</th><th>Budget</th><th>Sent to</th><th>Sharing</th><th></th></tr></thead><tbody>
      ${rows.map((l) => `<tr><td>${esc(l.created_at)}</td><td>${esc(maskName(l.name))}</td><td>${esc(l.property_type || '-')}</td><td>${esc(l.budget_range || '-')}</td><td>${esc(l.firms || '-')}</td><td>${esc(sharingState(l))}</td>
        <td>${l.share_ok && !l.released_at ? `<form method="post" action="/dashboard/enquiries/${l.id}/stop" class="inline"><button class="btn btn-sm btn-outline" type="submit">Stop sharing</button></form>` : ''}</td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No enquiries yet.</p>'}
    </div>
    <div class="dash-card">
      <h2 style="margin-top:0;">Held as spam (${junk.length})</h2>
      <p>These were not sent to any firm. Press <strong>Not spam</strong> if one is a real homeowner, and it goes where it would have gone. Held enquiries are wiped after 90 days like any other nobody has seen.</p>
      ${junk.length ? `<table class="data-table"><thead><tr><th>Date (UTC)</th><th>Name</th><th>Message</th><th>Why</th><th></th></tr></thead><tbody>
      ${junk.map((l) => `<tr><td>${esc(l.created_at)}</td><td>${esc(String(l.name).slice(0, 30))}</td><td>${esc(String(l.message || '').replace(/https?:\/\/\S+/g, '[link]').replace(/\S+@\S+/g, '[email]').slice(0, 110))}</td><td>${esc(l.spam_why)}</td>
        <td><form method="post" action="/dashboard/enquiries/${l.id}/notspam" class="inline"><button class="btn btn-sm btn-outline" type="submit">Not spam</button></form></td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">Nothing held.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/enquiries', inner, ctx));
}

export async function enquiryNotSpam(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const done = notSpam(db, id, matchLead);
  console.log(`[enquiries] lead #${id} marked not spam by ${ctx.business.email}: ${done ? 'sent on' : 'nothing held'}`);
  res.writeHead(302, { Location: `/dashboard/enquiries?${done ? 'ok' : 'err'}=${encodeURIComponent(done ? 'Sent on, as it would have gone.' : 'That enquiry is not held.')}` });
  res.end();
}

export async function enquiryStop(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const done = stopSharing(db, id);
  console.log(`[enquiries] sharing of lead #${id} stopped by ${ctx.business.email}: ${done ? 'yes' : 'no change'}`);
  res.writeHead(302, { Location: `/dashboard/enquiries?${done ? 'ok' : 'err'}=${encodeURIComponent(done ? 'This enquiry will not be shared.' : 'Nothing to stop: it was already shared or not shareable.')}` });
  res.end();
}
