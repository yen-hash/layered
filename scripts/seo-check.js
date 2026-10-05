// scripts/seo-check.js — crawl the running site from its sitemap and flag on-page SEO problems.
//   node scripts/seo-check.js [baseUrl]      (default http://localhost:3000)
// Exits non-zero if any page has an error, so it can run in CI.
const base = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const get = async (p) => fetch(base + p, { redirect: 'manual' });
const attr = (html, re) => (html.match(re) || [])[1] || '';

const problems = [];
const warn = (url, msg) => problems.push({ level: 'warn', url, msg });
const err = (url, msg) => problems.push({ level: 'error', url, msg });

const sitemap = await (await get('/sitemap.xml')).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname);
console.log(`Checking ${paths.length} URLs from sitemap on ${base}\n`);

const titles = new Map();
const descriptions = new Map();
const linked = new Set();

for (const p of paths) {
  const r = await get(p);
  if (r.status !== 200) { err(p, `sitemap URL returned ${r.status}`); continue; }
  const html = await r.text();

  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/);
  const h1s = (html.match(/<h1[\s>]/g) || []).length;

  if (!title) err(p, 'missing <title>');
  else {
    if (title.length > 65) warn(p, `title is ${title.length} chars (aim for ≤ 60): "${title}"`);
    if (title.length < 20) warn(p, `title is short (${title.length}): "${title}"`);
    titles.set(title, [...(titles.get(title) || []), p]);
  }
  if (!desc) err(p, 'missing meta description');
  else {
    if (desc.length > 165) warn(p, `meta description is ${desc.length} chars (aim for 120-160)`);
    if (desc.length < 70) warn(p, `meta description is short (${desc.length})`);
    descriptions.set(desc, [...(descriptions.get(desc) || []), p]);
  }
  if (h1s !== 1) err(p, `${h1s} <h1> tags (want exactly 1)`);
  if (!canonical) err(p, 'missing canonical');
  else if (new URL(canonical).pathname !== p) warn(p, `canonical points elsewhere: ${canonical}`);
  if (/noindex/.test(robots)) err(p, 'sitemap URL is noindex');
  if (!/<html lang="en-SG"/.test(html)) warn(p, 'html lang is not en-SG');
  if (!/property="og:image"/.test(html)) warn(p, 'missing og:image');

  // structured data must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(p, `invalid JSON-LD: ${e.message}`); }
  }

  // every <img> needs an alt attribute (empty is fine for decorative images)
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) err(p, `image without alt: ${m[0].slice(0, 90)}`);
    if (!/\bwidth=/.test(m[0])) warn(p, `image without width/height (layout shift): ${m[0].slice(0, 80)}`);
  }

  // collect internal links
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(\/[^"#]*)"/g)) linked.add(m[1].split('?')[0]);
}

for (const [t, ps] of titles) if (ps.length > 1) warn(ps.join(', '), `duplicate title "${t}"`);
for (const [d, ps] of descriptions) if (ps.length > 1) warn(ps.join(', '), `duplicate meta description`);

// internal links must resolve (skip private/action URLs and static files)
const skip = (l) => /^\/(logout|dashboard|leads)/.test(l) || /\.(css|svg|jpg|png|webp|xml|txt)$/.test(l) || l.startsWith('/uploads/');
for (const l of [...linked].filter((l) => !skip(l))) {
  const r = await get(l);
  if (r.status >= 400) err(l, `broken internal link (${r.status})`);
  else if (r.status >= 300) warn(l, `internal link redirects (${r.status} -> ${r.headers.get('location')}); link to the final URL`);
}

// robots.txt sanity
const robots = await (await get('/robots.txt')).text();
if (!/Sitemap:/i.test(robots)) err('/robots.txt', 'no Sitemap line');

const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warn');
for (const p of [...errors, ...warnings]) console.log(`${p.level === 'error' ? 'ERROR' : 'warn '}  ${p.url}  ${p.msg}`);
console.log(`\n${paths.length} pages, ${linked.size} distinct internal links checked: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
