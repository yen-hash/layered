import { db, PROPERTY_TYPES, STYLES, BUDGET_RANGES } from '../db.js';
import { esc, layout, placeholderIllustration } from '../lib/render.js';
import { dispatchLeadNotifications } from '../lib/notify.js';

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function designerCard(b) {
  const tags = [...(b.property_types || '').split(',').filter(Boolean), ...(b.styles || '').split(',').filter(Boolean)];
  const thumbImage = b.logo_url || placeholderIllustration(b.id);
  return `
  <a class="card designer-card" href="/designers/${esc(b.slug)}">
    <div class="thumb" style="background-image:url('${esc(thumbImage)}')"></div>
    <div class="body">
      <h3>${esc(b.company_name)}${b.featured ? ' ⭐' : ''}</h3>
      <div class="muted">${esc(b.service_areas || 'Singapore')}</div>
      <div class="tag-row">${tags.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>
  </a>`;
}

function chipGroup(name, options, checkedList = []) {
  return `<div class="chip-group">${options.map((o) => `
    <label><input type="checkbox" name="${name}" value="${esc(o)}" ${checkedList.includes(o) ? 'checked' : ''}> ${esc(o)}</label>
  `).join('')}</div>`;
}

function leadFormHtml(prefill = {}) {
  return `
  <div class="lead-form-section" id="get-recommendations">
    <h2>Get matched with the right interior designer</h2>
    <p class="section-sub">Tell us about your project. We'll send your brief straight to designers who fit — you'll hear back directly from them.</p>
    <form class="panel wide" method="post" action="/leads">
      <div class="two-col">
        <div class="field"><label>Your name</label><input type="text" name="name" required></div>
        <div class="field"><label>Email</label><input type="email" name="email" required></div>
      </div>
      <div class="two-col">
        <div class="field"><label>Phone</label><input type="tel" name="phone"></div>
        <div class="field"><label>Location / estate</label><input type="text" name="location" placeholder="e.g. Punggol, Tampines"></div>
      </div>
      <div class="two-col">
        <div class="field">
          <label>Property type</label>
          <select name="property_type">
            <option value="">Select one</option>
            ${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Budget</label>
          <select name="budget_range">
            <option value="">Select a range</option>
            ${BUDGET_RANGES.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>Preferred style (optional)</label>
        <select name="style">
          <option value="">No preference</option>
          ${STYLES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Tell us about your project</label>
        <textarea name="message" placeholder="e.g. 4-room HDB resale, looking to renovate kitchen and living room, hoping to start in 2 months"></textarea>
      </div>
      <button class="btn btn-block" type="submit">Get My Recommendations</button>
    </form>
  </div>`;
}

export async function homeRoute(req, res, ctx) {
  const featured = db.prepare('SELECT * FROM businesses ORDER BY featured DESC, created_at DESC LIMIT 6').all();
  const counts = db.prepare('SELECT (SELECT COUNT(*) FROM businesses) AS businesses, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM leads) AS leads').get();

  const body = `
  <section class="hero">
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <h1>Find an interior designer you can trust</h1>
        <p class="lead">Tell us about your renovation and we'll match you with vetted designers who take on projects like yours — no spam, no obligation.</p>
        <a class="btn" href="#get-recommendations">Get My Recommendations</a>
        <div class="stats">
          <div class="stat"><b>${counts.businesses}</b><span>Designers listed</span></div>
          <div class="stat"><b>${counts.projects}</b><span>Projects to browse</span></div>
          <div class="stat"><b>${counts.leads}</b><span>Homeowners matched</span></div>
        </div>
      </div>
      <div class="hero-art"><img src="/images/hero.jpg" alt="A bright, styled living room" loading="eager"></div>
    </div>
  </section>
  <section class="wrap">
    <h2>Featured designers</h2>
    <p class="section-sub">A snapshot of firms on Layered right now.</p>
    <div class="grid grid-3">${featured.map(designerCard).join('') || '<p class="muted">No designers listed yet.</p>'}</div>
    <p style="margin-top:20px"><a href="/designers">Browse the full directory →</a></p>
  </section>
  <section class="wrap">${leadFormHtml()}</section>
  `;
  res.end(layout({ title: 'Find an interior designer', body, business: ctx.business, flash: ctx.flash }));
}

export async function directoryRoute(req, res, ctx, url) {
  const propertyType = url.searchParams.get('property_type') || '';
  const style = url.searchParams.get('style') || '';
  let sql = 'SELECT * FROM businesses WHERE 1=1';
  const params = [];
  if (propertyType) { sql += " AND (',' || property_types || ',') LIKE ?"; params.push(`%,${propertyType},%`); }
  if (style) { sql += " AND (',' || styles || ',') LIKE ?"; params.push(`%,${style},%`); }
  sql += ' ORDER BY featured DESC, created_at DESC';
  const list = db.prepare(sql).all(...params);

  const body = `
  <section class="wrap">
    <h2>Interior designers</h2>
    <p class="section-sub">${list.length} firm${list.length === 1 ? '' : 's'} found.</p>
    <form class="panel wide" method="get" action="/designers" style="margin-bottom:28px;">
      <div class="two-col">
        <div class="field">
          <label>Property type</label>
          <select name="property_type" onchange="this.form.submit()">
            <option value="">Any</option>
            ${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}" ${p === propertyType ? 'selected' : ''}>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Style</label>
          <select name="style" onchange="this.form.submit()">
            <option value="">Any</option>
            ${STYLES.map((s) => `<option value="${esc(s)}" ${s === style ? 'selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
        </div>
      </div>
    </form>
    <div class="grid grid-3">${list.map(designerCard).join('') || '<p class="muted">No designers match those filters yet.</p>'}</div>
  </section>`;
  res.end(layout({ title: 'Browse interior designers', body, business: ctx.business, flash: ctx.flash }));
}

export async function designerProfileRoute(req, res, ctx, slug) {
  const b = db.prepare('SELECT * FROM businesses WHERE slug = ?').get(slug);
  if (!b) { res.statusCode = 404; res.end(layout({ title: 'Not found', body: '<div class="wrap"><h2>Designer not found</h2></div>', business: ctx.business })); return; }
  const projects = db.prepare('SELECT * FROM projects WHERE business_id = ? ORDER BY created_at DESC').all(b.id);
  const tags = [...(b.property_types || '').split(',').filter(Boolean), ...(b.styles || '').split(',').filter(Boolean)];

  const body = `
  <div class="profile-hero">
    <div class="wrap row">
      <div class="logo-circle" style="${b.logo_url ? `background-image:url('${esc(b.logo_url)}')` : ''}">${b.logo_url ? '' : esc(initials(b.company_name))}</div>
      <div>
        <h1 style="margin:0 0 6px;">${esc(b.company_name)}${b.featured ? ' ⭐' : ''}</h1>
        <p class="muted" style="margin:0 0 8px;">${esc(b.service_areas || 'Singapore')}</p>
        <div class="tag-row">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>
  </div>
  <section class="wrap">
    <div class="grid grid-2" style="grid-template-columns: 2fr 1fr; align-items:start;">
      <div>
        <h2>About</h2>
        <p>${esc(b.bio) || '<span class="muted">This designer hasn\'t added a bio yet.</span>'}</p>
        <h2>Projects (${projects.length})</h2>
        <div class="project-grid">
          ${projects.map((p) => `
          <div class="card project-card">
            <div class="thumb" style="background-image:url('${esc(p.cover_image || placeholderIllustration(p.id))}')"></div>
            <div class="body">
              <h4>${esc(p.title)}</h4>
              <div class="tag-row">${[p.property_type, p.style].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </div>
          </div>`).join('') || '<p class="muted">No projects uploaded yet.</p>'}
        </div>
      </div>
      <div>${leadFormHtml({})}</div>
    </div>
  </section>`;
  res.end(layout({ title: b.company_name, body, business: ctx.business, flash: ctx.flash }));
}

export async function submitLeadRoute(req, res, ctx, fields) {
  const name = (fields.name || '').trim();
  const email = (fields.email || '').trim();
  if (!name || !email) {
    res.writeHead(302, { Location: '/?err=' + encodeURIComponent('Please provide at least your name and email.') });
    res.end();
    return;
  }

  const insertLead = db.prepare(`INSERT INTO leads (name, email, phone, property_type, style, budget_range, location, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = insertLead.run(name, email, fields.phone || '', fields.property_type || '', fields.style || '', fields.budget_range || '', fields.location || '', fields.message || '');
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(info.lastInsertRowid);

  let matches = [];
  if (fields.property_type) {
    matches = db.prepare(`SELECT * FROM businesses WHERE (',' || property_types || ',') LIKE ? ORDER BY featured DESC, created_at DESC LIMIT 6`)
      .all(`%,${fields.property_type},%`);
  }
  if (matches.length === 0) {
    matches = db.prepare('SELECT * FROM businesses ORDER BY featured DESC, created_at DESC LIMIT 6').all();
  }

  const insertMatch = db.prepare('INSERT INTO lead_matches (lead_id, business_id) VALUES (?, ?)');
  for (const business of matches) {
    insertMatch.run(lead.id, business.id);
    dispatchLeadNotifications(business, lead).catch((err) => console.error('notify error', err));
  }

  res.writeHead(302, { Location: '/?ok=' + encodeURIComponent(`Thanks ${name}! We've sent your project to ${matches.length} matching designer${matches.length === 1 ? '' : 's'}. Expect replies by email/phone shortly.`) });
  res.end();
}
