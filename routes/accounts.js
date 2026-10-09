// routes/accounts.js — admin-only: create a one-time password reset link for a firm's account, so an admin can
// onboard or recover a firm without depending on email delivery. Lives under /dashboard (auth, noindex, no-store
// already apply). The link is shown once on the response page and never put in a URL, flash message or log.
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { abs } from '../lib/seo.js';
import { isAdmin } from '../lib/admin.js';
import { createResetToken, RESET_TTL_MINUTES } from '../lib/passwordReset.js';
import { dashLayout } from './dashboard.js';

const forbidden = (res, ctx) => {
  res.statusCode = 403;
  res.end(dashLayout('/dashboard/accounts', '<h1>Not allowed</h1><p class="muted">Account tools are limited to admins. Set <code>ADMIN_EMAILS</code> to include your login email.</p>', ctx));
};

export async function accountsList(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const firms = db.prepare('SELECT id, slug, company_name, email, category, created_at FROM businesses ORDER BY company_name').all();
  const inner = `
    <div class="head-row"><h1>Accounts</h1></div>
    <div class="dash-card">
      <p>Create a one-time reset link for a firm that cannot log in, or to give a new firm its first access. Send the link to the firm yourself (WhatsApp or email). It works once and lasts ${RESET_TTL_MINUTES} minutes, and a new link cancels any older one.</p>
      <p class="muted small">Only send a link to the person who owns the account. Anyone holding the link can set that account's password.</p>
    </div>
    <div class="dash-card">
      ${firms.length ? `<table class="data-table"><thead><tr><th>Firm</th><th>Login email</th><th>Category</th><th></th></tr></thead><tbody>
      ${firms.map((b) => `<tr><td><a href="/designers/${esc(b.slug)}" target="_blank"><strong>${esc(b.company_name)}</strong></a></td><td>${esc(b.email)}</td><td>${esc(b.category || '')}</td>
        <td><form method="post" action="/dashboard/accounts/${b.id}/reset" class="inline"><button class="btn btn-sm" type="submit">Create reset link</button></form></td></tr>`).join('')}
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
