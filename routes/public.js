import { db, PROPERTY_TYPES, STYLES, BUDGET_RANGES } from '../db.js';
import { esc, layout, placeholderIllustration } from '../lib/render.js';
import { dispatchLeadNotifications } from '../lib/notify.js';
import { credentialBadges, credentialsPanel } from '../lib/credentials.js';
import { abs, breadcrumbSchema, organizationSchema, websiteSchema } from '../lib/seo.js';
import { breadcrumbNav } from '../lib/components.js';
import { PROPERTY_PAGES, STYLE_PAGES } from '../content/landing.js';
import { GUIDES } from '../content/guides.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// A logo is usable if it's an external URL, or a local file that exists and isn't
// suspiciously tiny (a blank/transparent export is only a couple of KB).
const MIN_LOGO_BYTES = 2048;
function usableLogo(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  try {
    const file = path.join(PUBLIC_DIR, decodeURIComponent(url.split('?')[0]));
    if (!file.startsWith(PUBLIC_DIR)) return '';
    return fs.statSync(file).size >= MIN_LOGO_BYTES ? url : '';
  } catch { return ''; }
}

export function designerCard(b) {
  const tags = [...(b.property_types || '').split(',').filter(Boolean), ...(b.styles || '').split(',').filter(Boolean)];
  const logo = usableLogo(b.logo_url);
  const img = logo
    ? `<img src="${esc(logo)}" alt="${esc(b.company_name)} interior design" loading="lazy" width="600" height="300">`
    : `<img src="${esc(placeholderIllustration(b.id))}" alt="" loading="lazy" width="600" height="300">`;
  return `
  <a class="card designer-card" href="/designers/${esc(b.slug)}">
    <div class="thumb">${img}</div>
    <div class="body">
      <h3>${esc(b.company_name)}${b.featured ? ' ⭐' : ''}</h3>
      <div class="muted">${esc(b.service_areas || 'Singapore')}</div>
      ${credentialBadges(b)}
      <div class="tag-row">${tags.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>
  </a>`;
}

function chipGroup(name, options, checkedList = []) {
  return `<div class="chip-group">${options.map((o) => `
    <label><input type="checkbox" name="${name}" value="${esc(o)}" ${checkedList.includes(o) ? 'checked' : ''}> ${esc(o)}</label>
  `).join('')}</div>`;
}

export function leadFormHtml(prefill = {}) {
  const sel = (v, want) => (v === want ? ' selected' : '');
  return `
  <div class="lead-form-section" id="get-recommendations">
    <h2>Get matched with the right interior designer</h2>
    <p class="section-sub">Tell us about your project. We'll send your brief straight to designers who fit — you'll hear back directly from them.</p>
    <form class="panel wide" method="post" action="/leads">
      <div class="two-col">
        <div class="field"><label for="lf-name">Your name</label><input id="lf-name" type="text" name="name" autocomplete="name" required></div>
        <div class="field"><label for="lf-email">Email</label><input id="lf-email" type="email" name="email" autocomplete="email" required></div>
      </div>
      <div class="two-col">
        <div class="field"><label for="lf-phone">Phone</label><input id="lf-phone" type="tel" name="phone" autocomplete="tel"></div>
        <div class="field"><label for="lf-location">Location / estate</label><input id="lf-location" type="text" name="location" placeholder="e.g. Punggol, Tampines"></div>
      </div>
      <div class="two-col">
        <div class="field">
          <label for="lf-type">Property type</label>
          <select id="lf-type" name="property_type">
            <option value="">Select one</option>
            ${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}"${sel(prefill.propertyType, p)}>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="lf-budget">Budget</label>
          <select id="lf-budget" name="budget_range">
            <option value="">Select a range</option>
            ${BUDGET_RANGES.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="lf-style">Preferred style (optional)</label>
        <select id="lf-style" name="style">
          <option value="">No preference</option>
          ${STYLES.map((s) => `<option value="${esc(s)}"${sel(prefill.style, s)}>${esc(s)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="lf-message">Tell us about your project</label>
        <textarea id="lf-message" name="message" placeholder="e.g. 4-room HDB resale, looking to renovate kitchen and living room, hoping to start in 2 months"></textarea>
      </div>
      <button class="btn btn-block" type="submit">Get My Recommendations</button>
    </form>
  </div>`;
}

export async function homeRoute(req, res, ctx) {
  const featured = db.prepare('SELECT * FROM businesses ORDER BY featured DESC, created_at DESC LIMIT 6').all();
  const counts = db.prepare('SELECT (SELECT COUNT(*) FROM businesses) AS businesses, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM leads) AS leads').get();
  const site = ctx.site;

  const body = `
  <section class="hero">
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <h1>Find a trusted interior designer in Singapore</h1>
        <p class="lead">Compare interior designers and renovation firms for your HDB, condo, landed or commercial project. Tell us about your renovation and we'll match you with vetted designers who take on projects like yours — no spam, no obligation.</p>
        <a class="btn" href="#get-recommendations">Get My Recommendations</a>
        <div class="stats">
          <div class="stat"><b>${counts.businesses}</b><span>Designers listed</span></div>
          <div class="stat"><b>${counts.projects}</b><span>Projects to browse</span></div>
          <div class="stat"><b>${counts.leads}</b><span>Homeowners matched</span></div>
        </div>
      </div>
      <div class="hero-art"><img src="/images/hero.jpg" alt="Bright, modern living room interior with a sofa and pendant lights" width="1600" height="889" fetchpriority="high"></div>
    </div>
  </section>
  <section class="wrap">
    <h2>Interior designers in Singapore by property type</h2>
    <p class="section-sub">Whether you are renovating a new BTO, a resale flat, a condo or a landed home, start with firms that do your kind of project.</p>
    <div class="grid grid-4">
      ${Object.entries(PROPERTY_PAGES).map(([k, p]) => `<a class="card link-card" href="/interior-designers/${k}"><div class="body"><h3>${esc(p.title)}</h3><span class="more">Compare firms →</span></div></a>`).join('')}
    </div>
  </section>
  <section class="wrap">
    <h2>Featured designers</h2>
    <p class="section-sub">A snapshot of firms on Layered right now.</p>
    <div class="grid grid-3">${featured.map(designerCard).join('') || '<p class="muted">No designers listed yet.</p>'}</div>
    <p style="margin-top:20px"><a href="/designers">Browse the full directory →</a></p>
  </section>
  <section class="wrap">
    <h2>Renovation guides for Singapore homeowners</h2>
    <p class="section-sub">Costs, permits and how to pick the right firm, explained in plain English.</p>
    <div class="grid grid-3">
      ${GUIDES.slice(0, 3).map((g) => `<a class="card guide-card" href="/guides/${g.slug}"><div class="body"><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><span class="more">Read the guide →</span></div></a>`).join('')}
    </div>
    <p style="margin-top:20px"><a href="/guides">All renovation guides →</a></p>
  </section>
  <section class="wrap">${leadFormHtml()}</section>
  `;
  res.end(layout({
    fullTitle: 'Interior Designers & Renovation in Singapore | Layered',
    description: 'Find and compare trusted interior designers and renovation firms in Singapore for HDB, condo, landed and commercial projects. Get matched free.',
    path: '/', site,
    body, business: ctx.business, flash: ctx.flash,
    jsonLd: [organizationSchema(site), websiteSchema(site)],
  }));
}

export async function directoryRoute(req, res, ctx, url) {
  const propertyType = url.searchParams.get('property_type') || '';
  const style = url.searchParams.get('style') || '';
  const credential = url.searchParams.get('credential') || '';
  let sql = 'SELECT * FROM businesses WHERE 1=1';
  const params = [];
  if (propertyType) { sql += " AND (',' || property_types || ',') LIKE ?"; params.push(`%,${propertyType},%`); }
  if (style) { sql += " AND (',' || styles || ',') LIKE ?"; params.push(`%,${style},%`); }
  if (credential === 'hdb') sql += " AND hdb_licence_no != ''";
  else if (credential === 'casetrust') sql += " AND casetrust != ''";
  else if (credential === 'gold') sql += " AND casetrust = 'casetrust_gold'";
  sql += ' ORDER BY featured DESC, created_at DESC';
  const list = db.prepare(sql).all(...params);

  // Canonical: a single known property-type or style filter points at its landing page;
  // any other filtered view is a thin variation of /designers, so keep it out of the index.
  const validType = Object.entries(PROPERTY_PAGES).find(([, p]) => p.propertyType === propertyType);
  const validStyle = Object.entries(STYLE_PAGES).find(([, st]) => st.style === style);
  const filterCount = [propertyType, style, credential].filter(Boolean).length;
  let path = '/designers';
  let robots;
  if (filterCount === 1 && propertyType && validType) path = `/interior-designers/${validType[0]}`;
  else if (filterCount === 1 && style && validStyle) path = `/interior-designers/style/${validStyle[0]}`;
  else if (filterCount > 0) robots = 'noindex,follow';

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav([{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }])}
    <h1>Interior designers and renovation firms in Singapore</h1>
    <p class="section-sub">${list.length} firm${list.length === 1 ? '' : 's'} found. Filter by property type, style and credentials, or jump to <a href="/interior-designers/hdb">HDB</a>, <a href="/interior-designers/condo">condo</a>, <a href="/interior-designers/landed">landed</a> and <a href="/interior-designers/commercial">commercial</a> designers.</p>
  </section>
  <section class="wrap">
    <form class="panel wide" method="get" action="/designers" style="margin-bottom:28px;">
      <div class="two-col">
        <div class="field">
          <label for="f-type">Property type</label>
          <select id="f-type" name="property_type" onchange="this.form.submit()">
            <option value="">Any</option>
            ${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}" ${p === propertyType ? 'selected' : ''}>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="f-style">Style</label>
          <select id="f-style" name="style" onchange="this.form.submit()">
            <option value="">Any</option>
            ${STYLES.map((s) => `<option value="${esc(s)}" ${s === style ? 'selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="f-credential">Credentials</label>
        <select id="f-credential" name="credential" onchange="this.form.submit()">
          <option value="">Any</option>
          <option value="hdb" ${credential === 'hdb' ? 'selected' : ''}>HDB licensed</option>
          <option value="casetrust" ${credential === 'casetrust' ? 'selected' : ''}>CaseTrust accredited (any)</option>
          <option value="gold" ${credential === 'gold' ? 'selected' : ''}>CaseTrust Gold</option>
        </select>
      </div>
    </form>
    <div class="grid grid-3">${list.map(designerCard).join('') || '<p class="muted">No designers match those filters yet.</p>'}</div>
  </section>`;
  res.end(layout({
    title: 'Interior Designers in Singapore: Compare Firms',
    description: 'Browse interior designers and renovation firms in Singapore. Filter by HDB, condo, landed or commercial, by style, and by HDB licence and CaseTrust credentials.',
    path, robots, site: ctx.site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: breadcrumbSchema(ctx.site, [{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }]),
  }));
}

export async function designerProfileRoute(req, res, ctx, slug) {
  const site = ctx.site;
  const b = db.prepare('SELECT * FROM businesses WHERE slug = ?').get(slug);
  if (!b) {
    res.statusCode = 404;
    res.end(layout({ title: 'Designer not found', noindex: true, site, body: '<div class="wrap" style="padding:60px 0;"><h1>Designer not found</h1><p><a href="/designers">Browse all designers</a></p></div>', business: ctx.business }));
    return;
  }
  const projects = db.prepare('SELECT * FROM projects WHERE business_id = ? ORDER BY created_at DESC').all(b.id);
  const types = (b.property_types || '').split(',').filter(Boolean);
  const styles = (b.styles || '').split(',').filter(Boolean);
  const tags = [...types, ...styles];
  const path = `/designers/${b.slug}`;
  const trail = [{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }, { name: b.company_name, path }];

  const logo = usableLogo(b.logo_url);
  const bioText = (b.bio || '').replace(/\s+/g, ' ').trim();
  const description = (bioText.length >= 60
    ? bioText
    : `${b.company_name} is an interior design and renovation firm in Singapore${types.length ? ` taking on ${types.join(', ')} projects` : ''}${styles.length ? ` in ${styles.join(', ')} styles` : ''}. View projects and credentials, then request a quote.`
  ).slice(0, 155).replace(/\s+\S*$/, (m) => (bioText.length > 155 ? '…' : m));

  const projectAlt = (p) => [p.title, [p.property_type, p.style].filter(Boolean).join(' '), 'interior design by', b.company_name, 'Singapore'].filter(Boolean).join(' – ').replace(/ – interior design by – /, ' – interior design by ');

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': abs(site, path) + '#business',
    name: b.company_name,
    url: abs(site, path),
    description,
    areaServed: { '@type': 'Country', name: 'Singapore' },
    address: { '@type': 'PostalAddress', addressCountry: 'SG' },
    knowsAbout: [...types.map((t) => `${t} interior design`), ...styles.map((t) => `${t} interior design`)],
    image: [logo, ...projects.slice(0, 5).map((p) => p.cover_image)].filter(Boolean).map((u) => abs(site, u)),
  };
  // Credentials are deliberately left out of structured data: they are self-declared and
  // unverified, so we don't assert them to search engines.

  const body = `
  <div class="profile-hero">
    <div class="wrap row">
      <div class="logo-circle" style="${logo ? `background-image:url('${esc(logo)}')` : ''}" role="img" aria-label="${esc(b.company_name)} logo">${logo ? '' : esc(initials(b.company_name))}</div>
      <div>
        <h1 style="margin:0 0 6px;">${esc(b.company_name)}${b.featured ? ' ⭐' : ''}</h1>
        <p class="muted" style="margin:0 0 8px;">Interior design &amp; renovation · ${esc(b.service_areas || 'Singapore')}</p>
        ${credentialBadges(b)}
        <div class="tag-row">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>
  </div>
  <div class="wrap">${breadcrumbNav(trail)}</div>
  <section class="wrap">
    <div class="grid grid-2 profile-grid">
      <div>
        ${credentialsPanel(b)}
        <h2>About ${esc(b.company_name)}</h2>
        <p>${esc(b.bio) || '<span class="muted">This designer hasn\'t added a bio yet.</span>'}</p>
        <h2>Projects (${projects.length})</h2>
        <div class="project-grid">
          ${projects.map((p) => `
          <div class="card project-card">
            <div class="thumb"><img src="${esc(p.cover_image || placeholderIllustration(p.id))}" alt="${p.cover_image ? esc(projectAlt(p)) : ''}" loading="lazy" width="600" height="260"></div>
            <div class="body">
              <h3>${esc(p.title)}</h3>
              <div class="tag-row">${[p.property_type, p.style].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </div>
          </div>`).join('') || '<p class="muted">No projects uploaded yet.</p>'}
        </div>
      </div>
      <div>${leadFormHtml({})}</div>
    </div>
  </section>`;
  res.end(layout({
    fullTitle: `${b.company_name} | Interior Designer in Singapore`.slice(0, 70),
    description, path, site,
    image: projects.find((p) => p.cover_image)?.cover_image || logo || undefined,
    body, business: ctx.business, flash: ctx.flash,
    jsonLd: [localBusiness, breadcrumbSchema(site, trail)],
  }));
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
