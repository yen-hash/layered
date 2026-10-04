// routes/verification.js — admin-only: record that a firm's HDB licence / CaseTrust accreditation was
// checked against the official lookups. Lives under /dashboard (auth, noindex, no-store already apply).
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { CASETRUST_OPTIONS, HDB_LOOKUP_URL, CASETRUST_LOOKUP_URL, verifiedOn, VERIFICATION_MAX_AGE_DAYS } from '../lib/credentials.js';
import { dashLayout } from './dashboard.js';

const LABEL = Object.fromEntries(CASETRUST_OPTIONS.map((o) => [o.value, o.label]));
const redirect = (res, to) => { res.writeHead(302, { Location: to }); res.end(); };
const forbidden = (res, ctx) => {
  res.statusCode = 403;
  res.end(dashLayout('/dashboard/verification', '<h1>Not allowed</h1><p class="muted">Verification is limited to admins. Set <code>ADMIN_EMAILS</code> to include your login email.</p>', ctx));
};

function cell(b, kind) {
  const value = kind === 'hdb' ? b.hdb_licence_no : b.casetrust;
  if (!value) return '<span class="muted">Not declared</span>';
  const ok = verifiedOn(b, kind);
  const checkedValue = kind === 'hdb' ? b.hdb_verified_value : b.casetrust_verified_value;
  const shown = kind === 'hdb' ? esc(value) : esc(LABEL[value] || value);
  const link = kind === 'hdb' ? HDB_LOOKUP_URL : CASETRUST_LOOKUP_URL;
  let status;
  if (ok) status = `<span class="status-pill status-won">Verified ${esc(ok)}</span>`;
  else if (checkedValue && checkedValue !== value) status = '<span class="status-pill status-lost">Changed since check</span>';
  else if (checkedValue) status = '<span class="status-pill status-contacted">Check expired</span>';
  else status = '<span class="status-pill status-new">Unverified</span>';
  return `<strong>${shown}</strong><br>${status}<br>
    <a class="small" href="${link}" target="_blank" rel="noopener noreferrer">Open official lookup →</a>
    <form method="post" action="/dashboard/verification/${b.id}/${kind}/verify" class="inline"><button class="btn btn-sm" type="submit">${ok ? 'Re-verify today' : 'I checked this: verify'}</button></form>
    ${ok || checkedValue ? `<form method="post" action="/dashboard/verification/${b.id}/${kind}/clear" class="inline"><button class="btn btn-sm btn-outline" type="submit">Remove mark</button></form>` : ''}`;
}

export async function verificationList(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const firms = db.prepare("SELECT * FROM businesses WHERE hdb_licence_no != '' OR casetrust != '' ORDER BY company_name").all();
  const inner = `
    <div class="head-row"><h1>Verify credentials</h1></div>
    <div class="dash-card">
      <p><strong>Only mark a credential verified after you have checked it yourself.</strong> The mark appears publicly with today's date and says Layered checked it.</p>
      <ol>
        <li>Open the official lookup (links below) and search for the firm's <em>registered company name</em>.</li>
        <li>Confirm the company name matches, and the HDB licence number or CaseTrust tier matches what the firm declared.</li>
        <li>Confirm the status is active and not expired or suspended.</li>
        <li>Click <em>I checked this: verify</em>.</li>
      </ol>
      <p class="muted small">A mark is tied to the exact number or tier you checked: if the firm edits it, the mark disappears until you check again. Marks also lapse after ${VERIFICATION_MAX_AGE_DAYS} days.</p>
    </div>
    <div class="dash-card">
      ${firms.length ? `<table class="data-table"><thead><tr><th>Firm</th><th>HDB licence</th><th>CaseTrust</th></tr></thead><tbody>
      ${firms.map((b) => `<tr><td><a href="/designers/${esc(b.slug)}" target="_blank"><strong>${esc(b.company_name)}</strong></a><br><span class="muted small">${esc(b.email)}</span></td><td>${cell(b, 'hdb')}</td><td>${cell(b, 'casetrust')}</td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No firm has declared an HDB licence or CaseTrust accreditation yet.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/verification', inner, ctx));
}

export async function verificationAction(req, res, ctx, id, kind, action) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const b = db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  if (!b) return redirect(res, '/dashboard/verification?err=' + encodeURIComponent('Firm not found.'));
  const col = kind === 'hdb' ? 'hdb' : 'casetrust';
  const current = kind === 'hdb' ? b.hdb_licence_no : b.casetrust;
  if (action === 'clear') {
    db.prepare(`UPDATE businesses SET ${col}_verified_value = '', ${col}_verified_at = '' WHERE id = ?`).run(id);
    return redirect(res, '/dashboard/verification?ok=' + encodeURIComponent(`Removed the verified mark for ${b.company_name}.`));
  }
  if (!current) return redirect(res, '/dashboard/verification?err=' + encodeURIComponent('That firm has not declared this credential.'));
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(`UPDATE businesses SET ${col}_verified_value = ?, ${col}_verified_at = ? WHERE id = ?`).run(current, now, id);
  return redirect(res, '/dashboard/verification?ok=' + encodeURIComponent(`Marked ${b.company_name}'s ${kind === 'hdb' ? 'HDB licence' : 'CaseTrust accreditation'} as verified.`));
}
