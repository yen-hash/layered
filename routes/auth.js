import { db, slugify, PROPERTY_TYPES, STYLES } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { abs } from '../lib/seo.js';
import { sendEmail } from '../lib/notify.js';
import { createResetToken, findValidToken, consumeToken, passwordProblem, RESET_TTL_MINUTES, MIN_PASSWORD } from '../lib/passwordReset.js';
import { hashPassword, verifyPassword, createSessionToken, setCookie, clearCookie } from '../lib/auth.js';

function chipGroup(name, options) {
  return `<div class="chip-group">${options.map((o) => `
    <label><input type="checkbox" name="${name}" value="${esc(o)}"> ${esc(o)}</label>
  `).join('')}</div>`;
}

export async function signupPage(req, res, ctx) {
  const body = `
  <div class="wrap split-auth">
    <form class="panel" method="post" action="/signup">
      <h1>List your interior design business on Layered</h1>
      <p class="section-sub">Get a free profile, a project gallery, and inbound leads sent straight to your dashboard.</p>
      <div class="two-col">
        <div class="field"><label>Company name</label><input type="text" name="company_name" required></div>
        <div class="field"><label>Your name</label><input type="text" name="contact_name"></div>
      </div>
      <div class="two-col">
        <div class="field"><label>Work email</label><input type="email" name="email" required></div>
        <div class="field"><label>Password</label><input type="password" name="password" minlength="8" required></div>
      </div>
      <div class="two-col">
        <div class="field"><label>Phone</label><input type="tel" name="phone"></div>
        <div class="field"><label>Service areas</label><input type="text" name="service_areas" placeholder="e.g. Islandwide"></div>
      </div>
      <div class="field"><label>Property types you take on</label>${chipGroup('property_types', PROPERTY_TYPES)}</div>
      <div class="field"><label>Styles you specialize in</label>${chipGroup('styles', STYLES)}</div>
      <button class="btn btn-block" type="submit">Create business account</button>
      <p class="hint" style="margin-top:14px;text-align:center;">Already have an account? <a href="/login">Log in</a></p>
    </form>
  </div>`;
  res.end(layout({
    title: 'List Your Interior Design Business in Singapore',
    description: 'List your interior design or renovation firm on Layered to showcase projects, add your HDB licence and CaseTrust credentials, and receive homeowner leads.',
    path: '/signup', site: ctx.site, body, business: ctx.business, flash: ctx.flash,
  }));
}

export async function signupSubmit(req, res, fields) {
  const companyName = (fields.company_name || '').trim();
  const email = (fields.email || '').trim().toLowerCase();
  const password = fields.password || '';

  if (!companyName || !email || password.length < 8) {
    res.writeHead(302, { Location: '/signup?err=' + encodeURIComponent('Please fill in all required fields (password must be at least 8 characters).') });
    res.end();
    return;
  }

  const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
  if (existing) {
    res.writeHead(302, { Location: '/signup?err=' + encodeURIComponent('An account with that email already exists. Try logging in.') });
    res.end();
    return;
  }

  const propertyTypes = Array.isArray(fields.property_types) ? fields.property_types : (fields.property_types ? [fields.property_types] : []);
  const styles = Array.isArray(fields.styles) ? fields.styles : (fields.styles ? [fields.styles] : []);

  const slug = slugify(companyName);
  const passwordHash = hashPassword(password);
  const info = db.prepare(`INSERT INTO businesses (slug, company_name, email, password_hash, phone, contact_name, property_types, styles, service_areas, notify_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    slug, companyName, email, passwordHash, fields.phone || '', fields.contact_name || '',
    propertyTypes.join(','), styles.join(','), fields.service_areas || 'Islandwide', fields.phone || ''
  );

  const token = createSessionToken(info.lastInsertRowid);
  setCookie(res, 'session', token, { maxAge: 60 * 60 * 24 * 30 });
  res.writeHead(302, { Location: '/dashboard?ok=' + encodeURIComponent('Welcome to Layered! Your profile is live — add your first project to start getting leads.') });
  res.end();
}

export async function loginPage(req, res, ctx) {
  const body = `
  <div class="wrap split-auth">
    <form class="panel" method="post" action="/login">
      <h1>Business login</h1>
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <div class="field"><label>Password</label><input type="password" name="password" required></div>
      <button class="btn btn-block" type="submit">Log in</button>
      <p class="hint" style="margin-top:14px;text-align:center;"><a href="/forgot">Forgot your password?</a></p>
      <p class="hint" style="margin-top:14px;text-align:center;">New here? <a href="/signup">List your business</a></p>
    </form>
  </div>`;
  res.end(layout({ title: 'Business login', noindex: true, site: ctx.site, body, business: ctx.business, flash: ctx.flash }));
}

export async function loginSubmit(req, res, fields) {
  const email = (fields.email || '').trim().toLowerCase();
  const business = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
  if (!business || !verifyPassword(fields.password || '', business.password_hash)) {
    res.writeHead(302, { Location: '/login?err=' + encodeURIComponent('Incorrect email or password.') });
    res.end();
    return;
  }
  const token = createSessionToken(business.id);
  setCookie(res, 'session', token, { maxAge: 60 * 60 * 24 * 30 });
  res.writeHead(302, { Location: '/dashboard' });
  res.end();
}

export async function logoutRoute(req, res) {
  clearCookie(res, 'session');
  res.writeHead(302, { Location: '/' });
  res.end();
}

// ----- Password reset -----
export async function forgotPage(req, res, ctx) {
  const body = `
  <div class="wrap split-auth">
    <form class="panel" method="post" action="/forgot">
      <h1>Reset your password</h1>
      <p class="muted">Enter the email you signed up with. If it matches an account, we will email a link that works once for ${RESET_TTL_MINUTES} minutes.</p>
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <button class="btn btn-block" type="submit">Email me a reset link</button>
      <p class="hint" style="margin-top:14px;text-align:center;"><a href="/login">Back to login</a></p>
    </form>
  </div>`;
  res.end(layout({ title: 'Reset password', noindex: true, site: ctx.site, body, business: ctx.business, flash: ctx.flash }));
}

export async function forgotSubmit(req, res, ctx, fields) {
  const email = String(fields.email || '').trim().toLowerCase();
  const business = email ? db.prepare('SELECT * FROM businesses WHERE email = ?').get(email) : null;
  if (business) {
    const raw = createResetToken(db, business.id);
    await sendEmail({
      to: business.email,
      subject: 'Reset your Layered password',
      text: [`Hi ${business.contact_name || business.company_name},`, '', `Use this link to choose a new password. It works once and expires in ${RESET_TTL_MINUTES} minutes:`, '', abs(ctx.site, `/reset/${raw}`), '', 'If you did not ask for this, ignore this email. Your password has not changed.'].join('\n'),
    });
  }
  // Same answer whether or not the email exists, so the form cannot be used to find accounts.
  res.writeHead(302, { Location: '/login?ok=' + encodeURIComponent('If that email has an account, a reset link is on its way.') });
  res.end();
}

function resetForm(token, error = '') {
  return `
  <div class="wrap split-auth">
    <form class="panel" method="post" action="/reset/${token}">
      <h1>Choose a new password</h1>
      ${error ? `<p class="error" role="alert">${error}</p>` : ''}
      <div class="field"><label>New password</label><input type="password" name="password" minlength="${MIN_PASSWORD}" required autocomplete="new-password"></div>
      <div class="field"><label>Repeat new password</label><input type="password" name="confirm" minlength="${MIN_PASSWORD}" required autocomplete="new-password"></div>
      <button class="btn btn-block" type="submit">Save password</button>
    </form>
  </div>`;
}

const invalidLink = '<div class="wrap" style="padding:60px 0;"><h1>This link has expired</h1><p class="muted">Reset links work once and last an hour.</p><p><a class="btn" href="/forgot">Get a new link</a></p></div>';

export async function resetPage(req, res, ctx, token) {
  if (!findValidToken(db, token)) { res.statusCode = 410; return res.end(layout({ title: 'Link expired', noindex: true, site: ctx.site, body: invalidLink, business: ctx.business })); }
  res.end(layout({ title: 'Choose a new password', noindex: true, site: ctx.site, body: resetForm(token), business: ctx.business }));
}

export async function resetSubmit(req, res, ctx, token, fields) {
  const row = findValidToken(db, token);
  if (!row) { res.statusCode = 410; return res.end(layout({ title: 'Link expired', noindex: true, site: ctx.site, body: invalidLink, business: ctx.business })); }
  const problem = passwordProblem(fields.password, fields.confirm);
  if (problem) { res.statusCode = 400; return res.end(layout({ title: 'Choose a new password', noindex: true, site: ctx.site, body: resetForm(token, problem), business: ctx.business })); }
  if (!consumeToken(db, row.id)) { res.statusCode = 410; return res.end(layout({ title: 'Link expired', noindex: true, site: ctx.site, body: invalidLink, business: ctx.business })); }
  db.prepare('UPDATE businesses SET password_hash = ? WHERE id = ?').run(hashPassword(fields.password), row.business_id);
  res.writeHead(302, { Location: '/login?ok=' + encodeURIComponent('Password updated. Log in with your new password.') });
  res.end();
}
