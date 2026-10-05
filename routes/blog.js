// routes/blog.js — public blog: index, category archives, posts and the RSS feed.
import { db } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { abs, breadcrumbSchema } from '../lib/seo.js';
import { breadcrumbNav, formatDate } from '../lib/components.js';
import { renderMarkdown, wordCount, readingMinutes } from '../lib/markdown.js';
import { BLOG_CATEGORIES, categoryByName, categoryBySlug, CATEGORY_COVERS } from '../content/blog-meta.js';

const PAGE_SIZE = 9;
const isoDate = (s) => String(s || '').replace(' ', 'T').slice(0, 10);
export const coverFor = (p) => p.cover_image || CATEGORY_COVERS[p.category] || '/images/hero.jpg';

export function postCard(p, { large = false } = {}) {
  const cat = categoryByName(p.category);
  const minutes = readingMinutes(wordCount(renderMarkdown(p.body).text));
  return `
  <a class="card post-card${large ? ' post-card-lg' : ''}" href="/blog/${esc(p.slug)}">
    <div class="thumb"><img src="${esc(coverFor(p))}" alt="${esc(p.cover_alt || '')}" loading="${large ? 'eager' : 'lazy'}" width="800" height="450"></div>
    <div class="body">
      <span class="eyebrow">${esc(cat ? cat.name : p.category)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.excerpt)}</p>
      <span class="meta">${esc(formatDate(isoDate(p.published_at)))} · ${minutes} min read</span>
    </div>
  </a>`;
}

const categoryNav = (activeSlug) => `<nav class="chip-nav" aria-label="Blog categories">
  <a href="/blog" class="${activeSlug ? '' : 'active'}">All</a>
  ${BLOG_CATEGORIES.map((c) => `<a href="/blog/category/${c.slug}" class="${c.slug === activeSlug ? 'active' : ''}">${esc(c.name)}</a>`).join('')}
</nav>`;

function pagination(base, page, total) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return '';
  const href = (n) => (n === 1 ? base : `${base}?page=${n}`);
  return `<nav class="pagination" aria-label="Pages">${page > 1 ? `<a rel="prev" href="${href(page - 1)}">← Newer</a>` : '<span></span>'}<span>Page ${page} of ${pages}</span>${page < pages ? `<a rel="next" href="${href(page + 1)}">Older →</a>` : '<span></span>'}</nav>`;
}

async function listing(req, res, ctx, url, { category = null } = {}) {
  const site = ctx.site;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const where = category ? "status = 'published' AND category = ?" : "status = 'published'";
  const args = category ? [category.name] : [];
  const total = db.prepare(`SELECT COUNT(*) c FROM posts WHERE ${where}`).get(...args).c;
  const posts = db.prepare(`SELECT * FROM posts WHERE ${where} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`).all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const base = category ? `/blog/category/${category.slug}` : '/blog';
  const path = page > 1 ? `${base}?page=${page}` : base;
  const trail = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, ...(category ? [{ name: category.name, path: base }] : [])];
  const [first, ...rest] = posts;
  const showFeature = page === 1 && first;

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(trail)}
    <h1>${category ? esc(category.name) : 'The Layered renovation blog'}</h1>
    <p class="section-sub">${category ? esc(category.blurb) : 'Singapore renovation costs, rules and design ideas, written for homeowners.'}</p>
    ${categoryNav(category && category.slug)}
  </section>
  <section class="wrap">
    ${posts.length ? `
      ${showFeature ? `<div class="post-feature">${postCard(first, { large: true })}</div>` : ''}
      <div class="grid grid-3">${(showFeature ? rest : posts).map((p) => postCard(p)).join('')}</div>
      ${pagination(base, page, total)}` : '<p class="muted">No articles here yet. Check back soon.</p>'}
  </section>`;

  res.end(layout({
    title: category ? `${category.name}: Singapore Renovation Articles` : 'Singapore Renovation & Interior Design Blog',
    description: category
      ? `${category.blurb} Articles for Singapore homeowners.`
      : 'Renovation costs, HDB and condo rules, designer comparisons and interior design ideas for Singapore homeowners.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    robots: page > 1 ? 'noindex,follow' : undefined,
    jsonLd: breadcrumbSchema(site, trail),
  }));
}

export const blogIndexRoute = (req, res, ctx, url) => listing(req, res, ctx, url);
export async function blogCategoryRoute(req, res, ctx, url, slug) {
  const category = categoryBySlug(slug);
  if (!category) return notFound(res, ctx);
  return listing(req, res, ctx, url, { category });
}

function notFound(res, ctx) {
  res.statusCode = 404;
  res.end(layout({ title: 'Article not found', noindex: true, site: ctx.site, business: ctx.business, body: '<div class="wrap" style="padding:60px 0;"><h1>Article not found</h1><p><a href="/blog">Back to the blog</a></p></div>' }));
}

export async function blogPostRoute(req, res, ctx, slug) {
  const site = ctx.site;
  const p = db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug);
  // Drafts are only visible to admins (preview), and are never indexed.
  const preview = p && p.status !== 'published';
  if (!p || (preview && !ctx.isAdmin)) return notFound(res, ctx);

  const firm = p.author_business_id ? db.prepare('SELECT slug, company_name FROM businesses WHERE id = ?').get(p.author_business_id) : null;
  const md = renderMarkdown(p.body, { firm: Boolean(firm) });
  const words = wordCount(md.text);
  const path = `/blog/${p.slug}`;
  const cat = categoryByName(p.category);
  const trail = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, ...(cat ? [{ name: cat.name, path: `/blog/category/${cat.slug}` }] : []), { name: p.title, path }];
  const description = (p.meta_description || p.excerpt || md.text.slice(0, 155)).slice(0, 200);
  const related = db.prepare("SELECT * FROM posts WHERE status = 'published' AND id != ? ORDER BY (category = ?) DESC, published_at DESC LIMIT 3").all(p.id, p.category);
  const tags = (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const published = isoDate(p.published_at || p.created_at);
  const modified = isoDate(p.updated_at || p.published_at);
  const cover = coverFor(p);

  const body = `
  ${preview ? '<div class="preview-bar">Draft preview: only you can see this page, and it is not indexed.</div>' : ''}
  <article class="post">
    <header class="wrap post-head">
      ${breadcrumbNav(trail.slice(0, -1).concat([{ name: p.title.length > 48 ? `${p.title.slice(0, 46)}…` : p.title, path }]))}
      ${cat ? `<a class="eyebrow" href="/blog/category/${cat.slug}">${esc(cat.name)}</a>` : ''}
      <h1>${esc(p.title)}</h1>
      ${p.excerpt ? `<p class="post-dek">${esc(p.excerpt)}</p>` : ''}
      <p class="byline">By ${firm ? `<a href="/designers/${esc(firm.slug)}">${esc(firm.company_name)}</a>` : esc(p.author_name)} · <time datetime="${published}">${esc(formatDate(published))}</time>${modified && modified !== published ? ` · Updated <time datetime="${modified}">${esc(formatDate(modified))}</time>` : ''} · ${readingMinutes(words)} min read</p>
    </header>
    <figure class="post-cover wrap"><img src="${esc(cover)}" alt="${esc(p.cover_alt || '')}" width="1200" height="630" fetchpriority="high"></figure>
    <div class="wrap post-layout">
      <div class="post-main">
        ${md.headings.length >= 3 ? `<nav class="toc" aria-label="In this article"><strong>In this article</strong><ol>${md.headings.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
        <div class="prose">${md.html}</div>
        ${firm ? `<aside class="notice" role="note"><strong>Written by a listed firm.</strong> This article was written by <a href="/designers/${esc(firm.slug)}">${esc(firm.company_name)}</a>, a firm listed on Layered. Layered's editor reads submissions before publishing but does not verify every claim. The views and figures are the firm's own, and Layered does not endorse them.</aside>` : ''}
        ${tags.length ? `<p class="tag-row">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
        <div class="cta-box">
          <h2>Ready to find a designer?</h2>
          <p>Compare Singapore interior designers and renovation firms, then get matched for free.</p>
          <p><a class="btn btn-sm" href="/interior-designers/hdb">HDB designers</a> <a class="btn btn-sm" href="/interior-designers/condo">Condo designers</a> <a class="btn btn-sm btn-outline" href="/guides/renovation-checklist-singapore">Renovation checklist</a></p>
        </div>
      </div>
    </div>
    ${related.length ? `<section class="wrap related"><h2>Keep reading</h2><div class="grid grid-3">${related.map((r) => postCard(r)).join('')}</div></section>` : ''}
  </article>`;

  res.end(layout({
    title: p.title,
    fullTitle: (p.meta_title || `${p.title} | Layered`).slice(0, 90),
    description, path, site, image: cover, ogType: 'article',
    noindex: Boolean(preview),
    business: ctx.business, flash: ctx.flash, body,
    jsonLd: [
      breadcrumbSchema(site, trail),
      {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: p.title, description, inLanguage: 'en-SG',
        mainEntityOfPage: abs(site, path),
        datePublished: published, dateModified: modified || published,
        image: abs(site, cover), wordCount: words,
        keywords: [p.focus_keyword, ...tags].filter(Boolean).join(', ') || undefined,
        articleSection: p.category,
        author: firm ? { '@type': 'Organization', name: firm.company_name, url: abs(site, `/designers/${firm.slug}`) } : { '@type': 'Organization', name: p.author_name },
        publisher: { '@id': `${site}/#organization` },
      },
    ],
  }));
}

export async function rssRoute(req, res, ctx) {
  const site = ctx.site;
  const posts = db.prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 30").all();
  const rfc = (s) => new Date(String(s).replace(' ', 'T') + (String(s).includes('T') ? '' : 'Z')).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Layered renovation blog</title><link>${esc(site)}/blog</link>
<description>Singapore renovation costs, rules and interior design ideas.</description><language>en-SG</language>
<atom:link href="${esc(site)}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${esc(site)}/blog/${esc(p.slug)}</link><guid isPermaLink="true">${esc(site)}/blog/${esc(p.slug)}</guid><pubDate>${rfc(p.published_at)}</pubDate><category>${esc(p.category)}</category><description>${esc(p.meta_description || p.excerpt)}</description></item>`).join('\n')}
</channel></rss>`;
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900');
  res.end(xml);
}
