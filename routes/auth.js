import { db, slugify, PROPERTY_TYPES, STYLES } from '../db.js';
import { esc, layout } from '../lib/render.js';
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
      <h2>List your business on Layered</h2>
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
  res.end(layout({ title: 'List your business', body, business: ctx.business, flash: ctx.flash }));
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
      <h2>Business login</h2>
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <div class="field"><label>Password</label><input type="password" name="password" required></div>
      <button class="btn btn-block" type="submit">Log in</button>
      <p class="hint" style="margin-top:14px;text-align:center;">New here? <a href="/signup">List your business</a></p>
    </form>
  </div>`;
  res.end(layout({ title: 'Business login', body, business: ctx.business, flash: ctx.flash }));
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
