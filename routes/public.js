import { heroPlanSvg } from '../lib/planSvg.js';
import { TRADE_BY_SLUG, LANDED_PROS, LANDED_COSTS, CATEGORY_BY_SLUG, DEFAULT_CATEGORY, validCategory } from '../content/trades.js';
import { db, PROPERTY_TYPES, STYLES, BUDGET_RANGES } from '../db.js';
import { esc, layout, placeholderIllustration } from '../lib/render.js';
import { dispatchLeadNotifications } from '../lib/notify.js';
import { hasAccountAccess, maskLead } from '../lib/leadAccess.js';
import { credentialBadges, credentialsPanel } from '../lib/credentials.js';
import { abs, breadcrumbSchema, organizationSchema, websiteSchema } from '../lib/seo.js';
import { breadcrumbNav } from '../lib/components.js';
import { photoList } from './dashboard.js';
import { reviewsSection, reviewSchema, ratingBadge, summarise } from '../lib/reviews.js';
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

function publishedReviews(businessId) {
  return db.prepare("SELECT rating, body, reviewer_name, submitted_at FROM reviews WHERE business_id = ? AND status = 'published' ORDER BY moderated_at DESC").all(businessId);
}

// The category record for a business (interior design when unset or unknown).
export const categoryOf = (b) => CATEGORY_BY_SLUG[b.category] || CATEGORY_BY_SLUG[DEFAULT_CATEGORY];

const coverStmt = db.prepare("SELECT title, property_type, style, cover_image FROM projects WHERE business_id = ? AND cover_image != '' ORDER BY created_at DESC LIMIT 1");

export function designerCard(b) {
  const tags = [...(b.property_types || '').split(',').filter(Boolean), ...(b.styles || '').split(',').filter(Boolean)];
  const logo = usableLogo(b.logo_url);
  // Lead with a real project photo; the firm's logo sits small in the corner. Falls back to the illustration.
  const project = coverStmt.get(b.id);
  const cover = project
    ? `<img class="cover" src="${esc(project.cover_image)}" alt="${esc([project.title, [project.property_type, project.style].filter(Boolean).join(' '), 'by', b.company_name].filter(Boolean).join(' – '))}" loading="lazy" width="600" height="450">`
    : `<img class="cover" src="${esc(placeholderIllustration(b.id))}" alt="" loading="lazy" width="600" height="450">`;
  const badge = logo ? `<span class="logo-badge"><img src="${esc(logo)}" alt="${esc(b.company_name)} logo" loading="lazy" width="48" height="48"></span>` : '';
  const img = cover + badge;
  return `
  <div class="dcard">
  <button type="button" class="save-btn" data-save="${esc(b.slug)}" aria-pressed="false" aria-label="Save ${esc(b.company_name)} to shortlist" title="Save to shortlist"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.3 12C19 16.4 12 21 12 21z"/></svg></button>
  <a class="card designer-card" href="/designers/${esc(b.slug)}">
    <div class="thumb">${b.featured ? '<span class="pill-featured">Featured</span>' : ''}${img}</div>
    <div class="body">
      <h3>${esc(b.company_name)}</h3>
      <div class="muted">${esc(b.service_areas || 'Singapore')}</div>
      ${credentialBadges(b)}
      ${ratingBadge(summarise(publishedReviews(b.id)))}
      <div class="tag-row">${tags.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>
  </a>
  </div>`;
}

function chipGroup(name, options, checkedList = []) {
  return `<div class="chip-group">${options.map((o) => `
    <label><input type="checkbox" name="${name}" value="${esc(o)}" ${checkedList.includes(o) ? 'checked' : ''}> ${esc(o)}</label>
  `).join('')}</div>`;
}

export function leadFormHtml(prefill = {}, toBusiness = null) {
  const sel = (v, want) => (v === want ? ' selected' : '');
  return `
  <div class="lead-form-section" id="get-recommendations">
    <h2>${toBusiness ? `Send an enquiry to ${esc(toBusiness.company_name)}` : 'Get matched with the right interior designer'}</h2>
    <p class="section-sub">${toBusiness ? 'Tell them about your project. Your enquiry goes to this firm only.' : "Tell us about your project. We'll send your brief to designers who fit."}</p>
    <form class="panel wide" method="post" action="/leads">
      <input type="hidden" name="category" value="interior-design">
      ${toBusiness ? `<input type="hidden" name="business" value="${esc(toBusiness.slug)}">` : ''}
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
            ${BUDGET_RANGES.map((r) => `<option value="${esc(r)}"${sel(prefill.budget, r)}>${esc(r)}</option>`).join('')}
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
        <textarea id="lf-message" name="message" placeholder="e.g. 4-room HDB resale, looking to renovate kitchen and living room, hoping to start in 2 months">${esc(prefill.message || '')}</textarea>
      </div>
      <p class="muted small">Your phone number and email stay hidden from a firm until that firm unlocks your enquiry. If no firm unlocks it, we delete your contact details after 90 days. See our <a href="/privacy">privacy policy</a>.</p>
      <button class="btn btn-block" type="submit">Get My Recommendations</button>
    </form>
  </div>`;
}

// A short quote request for a renovation trade (or the landed team), routed by category.
export function quoteFormHtml(category, heading, intro = '', toBusiness = null) {
  return `
  <div class="lead-form-section" id="request">
    <h2>${esc(heading)}</h2>
    ${intro ? `<p class="section-sub">${esc(intro)}</p>` : ''}
    <form class="panel wide" method="post" action="/leads">
      <input type="hidden" name="category" value="${esc(category)}">
      ${toBusiness ? `<input type="hidden" name="business" value="${esc(toBusiness.slug)}">` : ''}
      <div class="two-col">
        <div class="field"><label for="qf-name">Your name</label><input id="qf-name" type="text" name="name" autocomplete="name" required></div>
        <div class="field"><label for="qf-email">Email</label><input id="qf-email" type="email" name="email" autocomplete="email" required></div>
      </div>
      <div class="two-col">
        <div class="field"><label for="qf-phone">Phone</label><input id="qf-phone" type="tel" name="phone" autocomplete="tel"></div>
        <div class="field"><label for="qf-location">Location / estate</label><input id="qf-location" type="text" name="location" placeholder="e.g. Punggol, Tampines"></div>
      </div>
      <div class="field"><label for="qf-type">Property type</label><select id="qf-type" name="property_type"><option value="">Select</option>${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select></div>
      <div class="field"><label for="qf-message">What do you need?</label><textarea id="qf-message" name="message" placeholder="Describe the job, sizes or quantities, and when you need it done"></textarea></div>
      <p class="muted small">Your phone number and email stay hidden from a firm until that firm unlocks your enquiry. If no firm unlocks it, we delete your contact details after 90 days. See our <a href="/privacy">privacy policy</a>.</p>
      <button class="btn btn-block" type="submit">Request quotes</button>
    </form>
  </div>`;
}

export async function homeRoute(req, res, ctx) {
  const featured = db.prepare("SELECT * FROM businesses WHERE category = 'interior-design' ORDER BY featured DESC, created_at DESC LIMIT 6").all();
  const counts = db.prepare('SELECT (SELECT COUNT(*) FROM businesses WHERE category = \'interior-design\') AS businesses, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM leads) AS leads, (SELECT COUNT(*) FROM posts WHERE status = \'published\') AS posts').get();
  const site = ctx.site;
  // The cost tools link here with ?type=...&budget=... (and the room planner with &brief=...) so the brief form starts filled in.
  const q = new URL(req.url, 'http://x').searchParams;
  const prefill = {
    propertyType: PROPERTY_TYPES.includes(q.get('type')) ? q.get('type') : undefined,
    budget: BUDGET_RANGES.includes(q.get('budget')) ? q.get('budget') : undefined,
    message: (q.get('brief') || '').slice(0, 1000) || undefined,
  };

  const body = `
  <section class="hero">
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <h1>Find an interior designer for your Singapore home</h1>
        <p class="lead">Compare firms by property type and style, check their HDB licence and CaseTrust credentials, and price your plan before you ask for a quote.</p>
        <div class="hero-cta">
          <a class="btn" href="#get-recommendations">Get matched</a>
          <a class="btn btn-outline" href="/tools/room-planner">Draw your layout</a>
        </div>
        <p class="hero-note">Free for homeowners. Credentials are self-declared unless a profile shows our checked mark and date. <a href="/guides/renovation-for-beginners-singapore">First time renovating?</a></p>
      </div>
      <div class="sheet">
        ${heroPlanSvg('hdb4')}
        <div class="sheet-bar">
          <div class="layer-toggles" role="group" aria-label="Show or hide drawing layers">
            <button type="button" data-layer="structure" aria-pressed="true" style="--key:#fbfdfb">Structure</button>
            <button type="button" data-layer="built" aria-pressed="true">Built-ins</button>
            <button type="button" data-layer="loose" aria-pressed="true" style="--key:#cfe0d8">Furniture</button>
          </div>
          <a class="sheet-link" href="/tools/room-planner">Plan your own flat</a>
        </div>
      </div>
    </div>
    <script>document.querySelectorAll('.layer-toggles button').forEach(function(b){b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!on));document.querySelectorAll('.plan-layer[data-layer="'+b.dataset.layer+'"]').forEach(function(l){l.toggleAttribute('hidden',on);});});});</script>
  </section>
  <section class="wrap">
    <h2>From first sketch to a shortlist</h2>
    <p class="section-sub">The tools are free and work together, so what you draw and price becomes a clear brief.</p>
    <div class="steps">
      <div class="step"><b>1</b><h3>Draw your layout</h3><p>Place rooms, wardrobes and kitchen cabinets to scale. Layered works out the floor area and carpentry foot runs.</p><a href="/tools/room-planner">Open the room planner</a></div>
      <div class="step"><b>2</b><h3>Price the plan</h3><p>See an itemised range from 2026 unit rates, with a buffer, before any firm has quoted.</p><a href="/tools/renovation-cost-estimator">Open the cost estimator</a></div>
      <div class="step"><b>3</b><h3>Compare and request quotes</h3><p>Shortlist designers who do your kind of home, check their credentials, and send one brief to several.</p><a href="/designers">Browse designers</a></div>
    </div>
  </section>
  <section class="wrap">
    <h2>Interior designers in Singapore by property type</h2>
    <p class="section-sub">Whether you are renovating a new BTO, a resale flat, a condo or a landed home, start with firms that do your kind of project.</p>
    <div class="grid grid-4">
      ${Object.entries(PROPERTY_PAGES).map(([k, p]) => `<a class="photo-tile" href="/interior-designers/${k}"><img src="/images/tile-${k}.jpg" alt="" width="720" height="540" loading="lazy"><span class="label"><h3>${esc(p.propertyType === 'Commercial' ? 'Commercial' : p.propertyType === 'HDB' ? 'HDB flats' : p.propertyType === 'Condo' ? 'Condos' : 'Landed homes')}</h3><span class="more">Compare designers</span></span></a>`).join('')}
    </div>
  </section>
  <section class="wrap">
    <h2>Featured designers</h2>
    <p class="section-sub">A snapshot of firms on Layered right now.</p>
    <div class="grid grid-3">${featured.map(designerCard).join('') || '<p class="muted">No designers listed yet.</p>'}</div>
    <p style="margin-top:20px"><a href="/designers">Browse the full directory →</a></p>
  </section>
  <section class="wrap">
    <h2>Everything else your renovation needs</h2>
    <div class="grid grid-2 home-beyond">
      <a class="card landed-feature" href="/landed"><div class="body"><span class="eyebrow">Premium</span><h3>Landed A&amp;A and rebuild</h3><p>Architects, structural engineers and landed builders, with 2026 costs, approvals and timelines.</p><span class="more">Explore landed →</span></div></a>
      <a class="card" href="/services"><div class="body"><h3>Renovation services</h3><p>Lighting, curtains and blinds, movers, aircon, flooring, electricians, plumbers and post-renovation cleaning.</p><span class="more">Find a trade →</span></div></a>
    </div>
  </section>
  <section class="wrap">
    <h2>Renovation guides for Singapore homeowners</h2>
    <p class="section-sub">Costs, permits and how to pick the right firm, explained in plain English.</p>
    <div class="grid grid-3">
      ${GUIDES.slice(0, 3).map((g) => `<a class="card guide-card" href="/guides/${g.slug}"><div class="body"><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p><span class="more">Read the guide →</span></div></a>`).join('')}
    </div>
    <p style="margin-top:20px"><a href="/guides">All renovation guides →</a></p>
    <a class="card calc-banner" href="/tools/renovation-cost-calculator"><span><strong>Free renovation cost calculator</strong><br><span class="muted">Estimate an HDB, condo, kitchen and bathroom or office budget from 2026 price ranges.</span></span><span class="more">Try it →</span></a>
  </section>
  <section class="wrap">${leadFormHtml(prefill)}</section>
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
  let sql = "SELECT * FROM businesses WHERE category = 'interior-design'";
  const params = [];
  if (propertyType) { sql += " AND (',' || property_types || ',') LIKE ?"; params.push(`%,${propertyType},%`); }
  if (style) { sql += " AND (',' || styles || ',') LIKE ?"; params.push(`%,${style},%`); }
  if (credential === 'hdb') sql += " AND hdb_licence_no != ''";
  else if (credential === 'casetrust') sql += " AND casetrust != ''";
  else if (credential === 'gold') sql += " AND casetrust = 'casetrust_gold'";
  else if (credential === 'verified') sql += " AND ((hdb_licence_no != '' AND hdb_verified_value = hdb_licence_no AND hdb_verified_at >= datetime('now', '-365 days')) OR (casetrust != '' AND casetrust_verified_value = casetrust AND casetrust_verified_at >= datetime('now', '-365 days')))";
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
    <form class="panel wide filter-bar" method="get" action="/designers">
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
          <option value="verified" ${credential === 'verified' ? 'selected' : ''}>Checked by Layered</option>
        </select>
      </div>
    </form>
    <h2 class="sr-only">Designers</h2>
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
  const cat = categoryOf(b);
  const isDesigner = cat.slug === DEFAULT_CATEGORY;
  const trail = isDesigner
    ? [{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }, { name: b.company_name, path }]
    : cat.path === '/landed'
      ? [{ name: 'Home', path: '/' }, { name: 'Landed A&A and rebuild', path: '/landed' }, { name: b.company_name, path }]
      : [{ name: 'Home', path: '/' }, { name: 'Renovation services', path: '/services' }, { name: cat.plural, path: cat.path }, { name: b.company_name, path }];

  const logo = usableLogo(b.logo_url);
  const bioText = (b.bio || '').replace(/\s+/g, ' ').trim();
  const description = (bioText.length >= 60
    ? bioText
    : isDesigner
      ? `${b.company_name} is an interior design and renovation firm in Singapore${types.length ? ` taking on ${types.join(', ')} projects` : ''}${styles.length ? ` in ${styles.join(', ')} styles` : ''}. View projects and credentials, then request a quote.`
      : `${b.company_name}: ${cat.name.toLowerCase()} in Singapore${b.service_areas ? `, serving ${b.service_areas}` : ''}. View their work and details, then request a quote on Layered.`
  ).slice(0, 155).replace(/\s+\S*$/, (m) => (bioText.length > 155 ? '…' : m));

  const extra = (p) => photoList(p).filter((u) => u !== p.cover_image).slice(0, 11);
  const caption = (p) => [p.title, p.photo_credit].filter(Boolean).join(' · ');
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
    knowsAbout: isDesigner ? [...types.map((t) => `${t} interior design`), ...styles.map((t) => `${t} interior design`)] : [cat.name],
    image: [logo, ...projects.slice(0, 5).map((p) => p.cover_image)].filter(Boolean).map((u) => abs(site, u)),
  };
  // Credentials are deliberately left out of structured data: they are self-declared and
  // unverified, so we don't assert them to search engines.

  const reviews = publishedReviews(b.id);
  Object.assign(localBusiness, reviewSchema(reviews) || {});

  const banner = projects.find((p) => p.cover_image)?.cover_image || '';
  const body = `
  <div class="profile-hero"${banner ? ` style="background-image:url('${esc(banner)}')"` : ''}>
    <div class="wrap row">
      <div class="logo-circle" style="${logo ? `background-image:url('${esc(logo)}')` : ''}" role="img" aria-label="${esc(b.company_name)} logo">${logo ? '' : esc(initials(b.company_name))}</div>
      <div>
        ${b.featured ? '<span class="pill-featured">Featured</span>' : ''}
        <h1>${esc(b.company_name)}</h1>
        <p class="muted" style="margin:0 0 8px;">${isDesigner ? 'Interior design &amp; renovation' : esc(cat.name)} · ${esc(b.service_areas || 'Singapore')}</p>
        ${credentialBadges(b)}
        <p><button type="button" class="btn btn-outline btn-sm" data-save="${esc(b.slug)}" aria-pressed="false">Save to shortlist</button></p>
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
        <p>${esc(b.bio) || '<span class="muted">This business hasn\'t added a bio yet.</span>'}</p>
        <h2>Projects (${projects.length})</h2>
        <div class="project-grid${projects.length >= 3 ? ' gallery' : ''}">
          ${projects.map((p) => {
            const src = p.cover_image || placeholderIllustration(p.id);
            const alt = p.cover_image ? projectAlt(p) : '';
            return `
          <div class="card project-card">
            <div class="thumb">${p.cover_image
              ? `<button type="button" class="lb-open" data-src="${esc(src)}" data-caption="${esc(caption(p))}" aria-label="View larger: ${esc(p.title)}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" width="600" height="450" onerror="this.onerror=null;this.src='${esc(placeholderIllustration(p.id))}'"></button>`
              : `<img src="${esc(src)}" alt="" loading="lazy" width="600" height="450">`}</div>
            ${extra(p).length ? `<div class="thumb-strip">${extra(p).map((u, i) => `<button type="button" class="lb-open" data-src="${esc(u)}" data-caption="${esc(caption(p))}" aria-label="View photo ${i + 2} of ${esc(p.title)}"><img src="${esc(u)}" alt="${esc(`${projectAlt(p)} – photo ${i + 2}`)}" loading="lazy" width="120" height="90"></button>`).join('')}</div>` : ''}
            <div class="body">
              <h3>${esc(p.title)}</h3>
              <div class="tag-row">${[p.property_type, p.style].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
              ${p.description ? `<p class="muted small project-desc">${esc(p.description.length > 150 ? p.description.slice(0, 147).trimEnd() + '…' : p.description)}</p>` : ''}
              ${p.photo_credit ? `<p class="muted small photo-credit">${esc(p.photo_credit)}</p>` : ''}
            </div>
          </div>`;
          }).join('') || '<p class="muted">No projects uploaded yet.</p>'}
        </div>
      </div>
      <div>${isDesigner ? leadFormHtml({}, b) : quoteFormHtml(cat.path === '/landed' ? 'landed' : cat.slug, cat.path === '/landed' ? 'Send a landed project brief' : `Request quotes from ${cat.plural.toLowerCase()}`, '', b)}</div>
    </div>
  </section>
  <section class="wrap" id="reviews">${reviewsSection(b, reviews)}</section>
  <dialog class="lightbox" id="lightbox" aria-label="Project photo"><button type="button" class="lb-close" aria-label="Close">×</button><figure><img src="" alt="" width="1200" height="800"><figcaption></figcaption></figure></dialog>
  <script>(function(){var d=document.getElementById('lightbox');if(!d||!d.showModal)return;var img=d.querySelector('img'),cap=d.querySelector('figcaption');
  document.querySelectorAll('.lb-open').forEach(function(b){b.addEventListener('click',function(){img.src=b.dataset.src;img.alt=b.querySelector('img').alt;cap.textContent=b.dataset.caption;d.showModal()})});
  d.querySelector('.lb-close').addEventListener('click',function(){d.close()});d.addEventListener('click',function(e){if(e.target===d)d.close()});})();</script>`;
  res.end(layout({
    fullTitle: `${b.company_name} | Interior Designer in Singapore`.slice(0, 70),
    description, path, site,
    image: projects.find((p) => p.cover_image)?.cover_image || logo || undefined,
    body, business: ctx.business, flash: ctx.flash,
    jsonLd: [localBusiness, breadcrumbSchema(site, trail)],
  }));
}

// Where a submitted brief goes: interior design briefs match on property type, landed briefs go to up
// to two each of architects, engineers and builders, and trade requests go to firms in that trade.
export function matchLead(category, propertyType) {
  if (category === 'landed') {
    return LANDED_PROS.flatMap((p) => db.prepare('SELECT * FROM businesses WHERE category = ? ORDER BY featured DESC, created_at DESC LIMIT 2').all(p.slug));
  }
  if (category !== DEFAULT_CATEGORY) {
    return db.prepare('SELECT * FROM businesses WHERE category = ? ORDER BY featured DESC, created_at DESC LIMIT 6').all(category);
  }
  let matches = [];
  if (propertyType) {
    matches = db.prepare(`SELECT * FROM businesses WHERE category = ? AND (',' || property_types || ',') LIKE ? ORDER BY featured DESC, created_at DESC LIMIT 6`)
      .all(DEFAULT_CATEGORY, `%,${propertyType},%`);
  }
  if (matches.length === 0) {
    matches = db.prepare('SELECT * FROM businesses WHERE category = ? ORDER BY featured DESC, created_at DESC LIMIT 6').all(DEFAULT_CATEGORY);
  }
  return matches;
}

export async function submitLeadRoute(req, res, ctx, fields) {
  const category = fields.category === 'landed' ? 'landed' : validCategory(fields.category);
  const back = category === 'landed' ? '/landed' : category === DEFAULT_CATEGORY ? '/' : `/services/${category}`;
  const name = (fields.name || '').trim();
  const email = (fields.email || '').trim();
  if (!name || !email) {
    res.writeHead(302, { Location: back + '?err=' + encodeURIComponent('Please provide at least your name and email.') });
    res.end();
    return;
  }

  let message = String(fields.message || '');
  let propertyType = fields.property_type || '';
  if (category === 'landed') {
    const scope = { aa: 'Addition and alteration (A&A)', rebuild: 'Reconstruction / rebuild', new: 'New erection' }[fields.scope] || '';
    const house = (LANDED_COSTS.rebuild[fields.house_type] || {}).label || '';
    message = [scope && `Scope: ${scope}.`, house && `House: ${house}.`, message].filter(Boolean).join(' ');
    propertyType = 'Landed';
  }

  const insertLead = db.prepare(`INSERT INTO leads (name, email, phone, property_type, style, budget_range, location, message, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = insertLead.run(name, email, fields.phone || '', propertyType, fields.style || '', fields.budget_range || '', fields.location || '', message.slice(0, 5000), category);
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(info.lastInsertRowid);

  // An enquiry sent from one firm's profile goes to that firm only; otherwise it goes to the matching firms.
  const direct = fields.business ? db.prepare('SELECT * FROM businesses WHERE slug = ?').get(String(fields.business)) : null;
  const matches = direct ? [direct] : matchLead(category, propertyType);
  const insertMatch = db.prepare('INSERT INTO lead_matches (lead_id, business_id, unlocked_at) VALUES (?, ?, ?)');
  for (const business of matches) {
    // Firms with a paid plan or a running trial receive the full details; everyone else gets a masked copy.
    const open = hasAccountAccess(business);
    insertMatch.run(lead.id, business.id, open ? new Date().toISOString().replace('T', ' ').slice(0, 19) : '');
    dispatchLeadNotifications(business, open ? lead : maskLead(lead), { locked: !open }).catch((err) => console.error('notify error', err));
  }

  const noun = category === DEFAULT_CATEGORY ? 'designer' : category === 'landed' ? 'professional' : 'firm';
  const msg = matches.length
    ? (direct
      ? `Thanks ${name}! Your enquiry has been sent to ${direct.company_name}. Your contact details are shared with them only once they unlock it.`
      : `Thanks ${name}! We've sent your request to ${matches.length} matching ${noun}${matches.length === 1 ? '' : 's'}. Your contact details are shared with a firm only once it unlocks your enquiry.`)
    : `Thanks ${name}! We've received your request. No firms in this category are listed yet, so we'll pass it on as soon as suitable firms join.`;
  res.writeHead(302, { Location: back + '?ok=' + encodeURIComponent(msg) });
  res.end();
}
