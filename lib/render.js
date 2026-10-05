// lib/render.js — tiny HTML templating helpers (no template engine dependency).
import { BRAND, LOCALE, DEFAULT_OG_IMAGE, abs, jsonLdScript } from './seo.js';

export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PROPERTY_LINKS = [
  ['/interior-designers/hdb', 'HDB interior designers'],
  ['/interior-designers/condo', 'Condo interior designers'],
  ['/interior-designers/landed', 'Landed home designers'],
  ['/interior-designers/commercial', 'Commercial interior designers'],
];
const GUIDE_LINKS = [
  ['/guides/hdb-renovation-cost-singapore', 'HDB renovation cost'],
  ['/guides/hdb-renovation-permit-and-rules', 'HDB renovation permit & rules'],
  ['/guides/condo-renovation-cost-and-rules', 'Condo renovation cost & rules'],
  ['/guides/how-to-choose-an-interior-designer-singapore', 'How to choose an interior designer'],
  ['/guides/casetrust-and-hdb-licence-explained', 'CaseTrust & HDB licence explained'],
  ['/guides/renovation-checklist-singapore', 'Renovation checklist'],
  ['/tools/renovation-cost-calculator', 'Cost calculator'],
  ['/blog', 'Renovation blog'],
];

// SEO inputs (all optional):
//   description  meta description (aim for 120-160 chars)
//   path         canonical path, e.g. '/designers' (needs `site`)
//   site         absolute site origin, e.g. 'https://www.layered.sg'
//   fullTitle    use as-is instead of "<title> | Layered"
//   noindex      keep out of search results (auth, dashboard, errors)
//   robots       explicit robots meta value (overrides noindex), e.g. 'noindex,follow'
//   image        og:image path or URL
//   jsonLd       structured data object(s)
// Many templates write <label>Text</label><input name="x">. Give each such control an id and point the label
// at it, so screen readers announce the label and clicking the label focuses the field.
export function associateLabels(html) {
  let n = 0;
  return html.replace(/<label>([^<]*)<\/label>(\s*)<(input|select|textarea)\b([^>]*)>/g, (m, text, ws, tag, attrs) => {
    const existing = attrs.match(/\sid="([^"]+)"/);
    const id = existing ? existing[1] : `f-${(attrs.match(/\sname="([^"]+)"/) || [])[1] || tag}-${++n}`;
    return `<label for="${id}">${text}</label>${ws}<${tag}${existing ? '' : ` id="${id}"`}${attrs}>`;
  });
}

export function layout(opts) {
  return associateLabels(renderLayout(opts));
}

function renderLayout({ title = 'Layered', body = '', business = null, flash = null, description = '', path = '', site = '', fullTitle = '', noindex = false, robots: robotsOverride = '', image = DEFAULT_OG_IMAGE, jsonLd = null, ogType = 'website' }) {
  const pageTitle = fullTitle || `${title} | ${BRAND}`;
  const canonical = site && path ? abs(site, path) : '';
  const ogImage = site ? abs(site, image) : '';
  const robots = robotsOverride || (noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
  return `<!doctype html>
<html lang="en-SG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<meta name="robots" content="${robots}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta name="theme-color" content="#b9704a">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="${LOCALE}">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:title" content="${esc(fullTitle || title)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ''}
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle || title)}">
${description ? `<meta name="twitter:description" content="${esc(description)}">` : ''}
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css">
${jsonLd ? jsonLdScript(jsonLd) : ''}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="/"><img src="/logo-mark.svg" alt="" width="26" height="26" class="logo-mark">Layered</a>
    <nav class="main-nav" aria-label="Main">
      <a href="/designers">Find Designers</a>
      <a href="/guides">Guides</a>
      <a href="/blog">Blog</a>
      <a class="nav-hide-sm" href="/#get-recommendations">Get Recommendations</a>
      ${business
        ? `<a href="/dashboard">Dashboard</a><a href="/logout">Log out</a>`
        : `<a href="/login">Business Login</a><a class="btn btn-sm" href="/signup">List Your Business</a>`
      }
    </nav>
  </div>
</header>
${flash ? `<div class="flash flash-${esc(flash.type)}" role="status"><div class="wrap">${esc(flash.message)}</div></div>` : ''}
<main id="main">${body}</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cols">
      <div>
        <p class="brand-line">Layered</p>
        <p class="muted">Connecting Singapore homeowners with trusted interior designers and renovation firms. Compare firms, check HDB and CaseTrust credentials, and plan your renovation with free guides.</p>
      </div>
      <nav aria-label="Interior designers by property type">
        <h2 class="footer-h">Find a designer</h2>
        <ul>${PROPERTY_LINKS.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}<li><a href="/designers">All designers</a></li></ul>
      </nav>
      <nav aria-label="Renovation guides">
        <h2 class="footer-h">Renovation guides</h2>
        <ul>${GUIDE_LINKS.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
      </nav>
    </div>
    ${process.env.NODE_ENV === 'production' ? '' : '<p class="muted">Demo build. Business directory, dashboard and lead routing are fully functional; payments and identity verification are not implemented.</p>'}
  </div>
</footer>
<script src="/shortlist.js" defer></script>
</body>
</html>`;
}

export function flashFromQuery(query) {
  if (query.get('ok')) return { type: 'ok', message: query.get('ok') };
  if (query.get('err')) return { type: 'err', message: query.get('err') };
  return null;
}

const ROOM_ILLUSTRATIONS = [
  '/illustrations/room-living.svg',
  '/illustrations/room-kitchen.svg',
  '/illustrations/room-bedroom.svg',
  '/illustrations/room-generic.svg',
];

// Deterministically picks a placeholder room illustration for a given seed
// (e.g. a project or business id) so the same item always gets the same
// picture instead of a random one on every render.
export function placeholderIllustration(seed) {
  const n = typeof seed === 'number' ? seed : String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROOM_ILLUSTRATIONS[n % ROOM_ILLUSTRATIONS.length];
}
