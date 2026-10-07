// routes/seo.js — robots.txt and sitemap.xml.
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { GUIDES, REVIEWED } from '../content/guides.js';
import { TRADES } from '../content/trades.js';
import { PROPERTY_PAGES, STYLE_PAGES } from '../content/landing.js';
import { BLOG_CATEGORIES } from '../content/blog-meta.js';
import { DATA_REVIEWED } from '../content/estimator.js';

export function robotsRoute(req, res, ctx) {
  const lines = [
    'User-agent: *',
    'Allow: /',
    // Private or action-only URLs. (Login is left crawlable but noindex so the noindex is seen.)
    'Disallow: /dashboard',
    'Disallow: /logout',
    'Disallow: /leads',
    'Disallow: /review/',
    'Disallow: /reset/',
    '',
    `Sitemap: ${ctx.site}/sitemap.xml`,
    '',
  ];
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(lines.join('\n'));
}

export function sitemapRoute(req, res, ctx) {
  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/designers', changefreq: 'daily', priority: '0.9' },
    { loc: '/guides', changefreq: 'weekly', priority: '0.8', lastmod: REVIEWED },
    ...Object.keys(PROPERTY_PAGES).map((k) => ({ loc: `/interior-designers/${k}`, changefreq: 'weekly', priority: '0.9' })),
    ...Object.keys(STYLE_PAGES).map((k) => ({ loc: `/interior-designers/style/${k}`, changefreq: 'weekly', priority: '0.6' })),
    { loc: '/guides/renovation-checklist-singapore', changefreq: 'monthly', priority: '0.9', lastmod: REVIEWED },
    ...GUIDES.map((g) => ({ loc: `/guides/${g.slug}`, changefreq: 'monthly', priority: '0.8', lastmod: REVIEWED })),
    { loc: '/tools/renovation-cost-calculator', changefreq: 'monthly', priority: '0.9', lastmod: DATA_REVIEWED },
    { loc: '/tools/renovation-cost-estimator', changefreq: 'monthly', priority: '0.9' },
    { loc: '/tools/room-planner', changefreq: 'monthly', priority: '0.8' },
    { loc: '/landed', changefreq: 'weekly', priority: '0.9' },
    { loc: '/services', changefreq: 'weekly', priority: '0.8' },
    ...TRADES.map((t) => ({ loc: `/services/${t.slug}`, changefreq: 'weekly', priority: '0.7' })),
    { loc: '/about', changefreq: 'yearly', priority: '0.3' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.2' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.2' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    ...BLOG_CATEGORIES.filter((c) => db.prepare("SELECT 1 FROM posts WHERE status = 'published' AND category = ?").get(c.name)).map((c) => ({ loc: `/blog/category/${c.slug}`, changefreq: 'weekly', priority: '0.6' })),
    ...db.prepare("SELECT slug, COALESCE(updated_at, published_at) AS m FROM posts WHERE status = 'published' ORDER BY published_at DESC").all()
      .map((p) => ({ loc: `/blog/${p.slug}`, changefreq: 'monthly', priority: '0.7', lastmod: String(p.m || '').slice(0, 10) || undefined })),
    { loc: '/signup', changefreq: 'monthly', priority: '0.4' },
    ...db.prepare('SELECT slug, created_at FROM businesses ORDER BY featured DESC, created_at DESC').all()
      .map((b) => ({ loc: `/designers/${b.slug}`, changefreq: 'weekly', priority: '0.7', lastmod: String(b.created_at || '').slice(0, 10) || undefined })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(ctx.site + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(xml);
}
