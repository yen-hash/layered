// lib/seo.js — helpers for canonical URLs, structured data and breadcrumbs.

export const BRAND = 'Layered';
export const LOCALE = 'en_SG';
export const DEFAULT_OG_IMAGE = '/og-default.jpg';

// Set SITE_URL in production (e.g. https://www.layered.sg) so canonical URLs, the
// sitemap and structured data never depend on whatever Host header a request carried.
export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto}://${req.headers.host}`;
}

export const abs = (site, pathOrUrl) => (/^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${site}${pathOrUrl}`);

// JSON-LD goes inside a <script>, so make sure nothing in the data can close it early.
export function jsonLdScript(data) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
  return items.map((d) => {
    const json = JSON.stringify(d).replace(/</g, '\\u003c').split('\u2028').join('').split('\u2029').join('');
    return `<script type="application/ld+json">${json}</script>`;
  }).join('\n');
}

export function breadcrumbSchema(site, trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: abs(site, t.path),
    })),
  };
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  };
}

export function organizationSchema(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: BRAND,
    url: site,
    logo: abs(site, '/logo-mark.svg'),
    description: 'Layered helps Singapore homeowners find and compare interior designers and renovation firms for HDB, condo, landed and commercial projects.',
    areaServed: { '@type': 'Country', name: 'Singapore' },
  };
}

export function websiteSchema(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    url: site,
    name: BRAND,
    inLanguage: 'en-SG',
    publisher: { '@id': `${site}/#organization` },
  };
}
