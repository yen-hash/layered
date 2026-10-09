// routes/accounts.js — admin-only: create a one-time password reset link for a firm's account, so an admin can
// onboard or recover a firm without depending on email delivery. Lives under /dashboard (auth, noindex, no-store
// already apply). The link is shown once on the response page and never put in a URL, flash message or log.
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { abs } from '../lib/seo.js';
import { isAdmin } from '../lib/admin.js';
import { createResetToken, RESET_TTL_MINUTES } from '../lib/passwordReset.js';
import { dashLayout } from './dashboard.js';
import { trialEnd, hasAccountAccess, maskName } from '../lib/leadAccess.js';

const forbidden = (res, ctx) => {
  res.statusCode = 403;
  res.end(dashLayout('/dashboard/accounts', '<h1>Not allowed</h1><p class="muted">Account tools are limited to admins. Set <code>ADMIN_EMAILS</code> to include your login email.</p>', ctx));
};

const ymd = (d) => d.toISOString().slice(0, 10);
function accessForm(b) {
  const end = trialEnd(b);
  const state = b.plan === 'paid' ? 'Paid' : end.getTime() > Date.now() ? `Trial to ${ymd(end)}` : 'Free (masked)';
  return `<strong>${esc(state)}</strong>
    <form method="post" action="/dashboard/accounts/${b.id}/access" class="inline" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
      <select name="plan" aria-label="Plan"><option value="free"${b.plan === 'paid' ? '' : ' selected'}>Free / trial</option><option value="paid"${b.plan === 'paid' ? ' selected' : ''}>Paid</option></select>
      <input type="date" name="trial_ends" value="${ymd(end)}" aria-label="Trial ends">
      <button class="btn btn-sm" type="submit">Save</button></form>`;
}

export async function accountsList(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const firms = db.prepare('SELECT id, slug, company_name, email, category, created_at, plan, trial_ends_at FROM businesses ORDER BY company_name').all();
  const inner = `
    <div class="head-row"><h1>Accounts</h1></div>
    <div class="dash-card">
      <p>Create a one-time reset link for a firm that cannot log in, or to give a new firm its first access. Send the link to the firm yourself (WhatsApp or email). It works once and lasts ${RESET_TTL_MINUTES} minutes, and a new link cancels any older one.</p>
      <p class="muted small">Only send a link to the person who owns the account. Anyone holding the link can set that account's password.</p>
    </div>
    <div class="dash-card">
      ${firms.length ? `<table class="data-table"><thead><tr><th>Firm</th><th>Login email</th><th>Lead access</th><th></th></tr></thead><tbody>
      ${firms.map((b) => `<tr><td><a href="/designers/${esc(b.slug)}" target="_blank"><strong>${esc(b.company_name)}</strong></a></td><td>${esc(b.email)}</td>
        <td>${accessForm(b)}</td>
        <td><form method="post" action="/dashboard/accounts/${b.id}/reset" class="inline"><button class="btn btn-sm" type="submit">Create reset link</button></form> <a class="btn btn-sm btn-outline" href="/dashboard/accounts/${b.id}/leads">Leads</a></td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No accounts yet.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/accounts', inner, ctx));
}

export async function accountReset(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const b = db.prepare('SELECT id, company_name, email FROM businesses WHERE id = ?').get(id);
  if (!b) {
    res.writeHead(302, { Location: '/dashboard/accounts?err=' + encodeURIComponent('Firm not found.') });
    return res.end();
  }
  const link = abs(ctx.site, `/reset/${createResetToken(db, b.id)}`);
  console.log(`[accounts] reset link created for business #${b.id} by ${ctx.business.email}`);
  const inner = `
    <div class="head-row"><h1>Reset link for ${esc(b.company_name)}</h1></div>
    <div class="dash-card">
      <p>Send this link to <strong>${esc(b.email)}</strong>. It works once and expires in ${RESET_TTL_MINUTES} minutes. <strong>It is shown only on this page</strong>, so copy it now.</p>
      <p><input type="text" readonly value="${esc(link)}" style="width:100%;" onclick="this.select()" aria-label="Reset link"></p>
      <p class="muted small">The firm opens the link, chooses a password and is logged in with the email above. Creating another link for this firm cancels this one.</p>
      <p><a class="btn btn-outline" href="/dashboard/accounts">Back to accounts</a></p>
    </div>`;
  res.end(dashLayout('/dashboard/accounts', inner, ctx));
}

const back = (res, to, msg, key = 'ok') => { res.writeHead(302, { Location: `${to}?${key}=${encodeURIComponent(msg)}` }); res.end(); };

// Admin: set a firm's plan and trial end date. A past trial date ends the trial.
export async function accountAccess(req, res, ctx, id, fields) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const b = db.prepare('SELECT id FROM businesses WHERE id = ?').get(id);
  if (!b) return back(res, '/dashboard/accounts', 'Firm not found.', 'err');
  const plan = fields.plan === 'paid' ? 'paid' : 'free';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(fields.trial_ends || '') ? `${fields.trial_ends} 23:59:59` : null;
  if (date) db.prepare('UPDATE businesses SET plan = ?, trial_ends_at = ? WHERE id = ?').run(plan, date, id);
  else db.prepare('UPDATE businesses SET plan = ? WHERE id = ?').run(plan, id);
  console.log(`[accounts] access for business #${id} set to ${plan} by ${ctx.business.email}`);
  back(res, '/dashboard/accounts', 'Lead access saved.');
}

// Admin: see a firm's leads (names shortened) and unlock or lock single leads.
export async function accountLeads(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const b = db.prepare('SELECT id, company_name, plan, trial_ends_at, created_at FROM businesses WHERE id = ?').get(id);
  if (!b) return back(res, '/dashboard/accounts', 'Firm not found.', 'err');
  const rows = db.prepare('SELECT lm.id AS match_id, lm.unlocked_at, lm.created_at, l.name, l.property_type, l.budget_range FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.business_id = ? ORDER BY lm.created_at DESC').all(id);
  const inner = `
    <p><a href="/dashboard/accounts">← Accounts</a></p>
    <div class="head-row"><h1>Leads for ${esc(b.company_name)}</h1></div>
    <div class="dash-card">
      <p class="muted small">Unlocking a lead gives this firm the homeowner's full contact details for that one lead. Use it when the firm has paid for that lead.</p>
      ${rows.length ? `<table class="data-table"><thead><tr><th>Date</th><th>Homeowner</th><th>Property</th><th>Budget</th><th>Contact details</th><th></th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.created_at)}</td><td>${esc(maskName(r.name))}</td><td>${esc(r.property_type || '-')}</td><td>${esc(r.budget_range || '-')}</td>
        <td>${r.unlocked_at ? 'Unlocked' : hasAccountAccess(b) ? 'Open (plan)' : 'Hidden'}</td>
        <td><form method="post" action="/dashboard/accounts/${id}/leads/${r.match_id}/${r.unlocked_at ? 'lock' : 'unlock'}" class="inline"><button class="btn btn-sm${r.unlocked_at ? ' btn-outline' : ''}" type="submit">${r.unlocked_at ? 'Lock again' : 'Unlock'}</button></form></td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No leads for this firm yet.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/accounts', inner, ctx));
}

export async function accountLeadToggle(req, res, ctx, id, matchId, unlock) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const at = unlock ? new Date().toISOString().replace('T', ' ').slice(0, 19) : '';
  db.prepare('UPDATE lead_matches SET unlocked_at = ? WHERE id = ? AND business_id = ?').run(at, matchId, id);
  console.log(`[accounts] lead match #${matchId} ${unlock ? 'unlocked' : 'locked'} for business #${id} by ${ctx.business.email}`);
  back(res, `/dashboard/accounts/${id}/leads`, unlock ? 'Lead unlocked.' : 'Lead locked.');
}
