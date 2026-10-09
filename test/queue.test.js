// Every queued (drip-published) article must meet the blog's SEO scorecard, have a unique slug and only link to
// pages that exist when it goes live. Keeps 300 articles from shipping a single broken page or thin article.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SEED_POSTS } from '../content/posts.js';
import { GUIDES } from '../content/guides.js';
import { TRADES } from '../content/trades.js';
import { BLOG_CATEGORIES } from '../content/blog-meta.js';

const dir = new URL('../content/queue/', import.meta.url);
const queue = [];
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js')).sort()) queue.push(...(await import(new URL(f, dir))).QUEUE);

const categories = new Set(BLOG_CATEGORIES.map((c) => c.name));
const guideSlugs = new Set([...GUIDES.map((g) => g.slug), 'renovation-checklist-singapore']);
const tradeSlugs = new Set(TRADES.map((t) => t.slug));
const fixedPages = new Set(['/', '/designers', '/landed', '/services', '/guides', '/blog', '/about', '/compare',
  '/tools/renovation-cost-calculator', '/tools/renovation-cost-estimator', '/tools/room-planner', '/resources', '/tools/design-style-quiz',
  '/interior-designers/hdb', '/interior-designers/condo', '/interior-designers/landed', '/interior-designers/commercial']);

const plain = (md) => md.replace(/[#*_`>|-]/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

test('queue slugs are unique and not already used', () => {
  const used = new Set(SEED_POSTS.map((p) => p.slug));
  for (const p of queue) {
    assert.ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug), `bad slug ${p.slug}`);
    assert.ok(!used.has(p.slug), `duplicate slug ${p.slug}`);
    used.add(p.slug);
  }
});

test('each queued article meets the SEO scorecard', () => {
  for (const p of queue) {
    const kw = p.focus_keyword.toLowerCase();
    const has = (t) => t.toLowerCase().includes(kw);
    const fail = (m) => assert.fail(`${p.slug}: ${m}`);
    if (!categories.has(p.category)) fail(`unknown category ${p.category}`);
    if (p.meta_title.length < 30 || p.meta_title.length > 60) fail(`meta title ${p.meta_title.length}`);
    if (p.meta_description.length < 120 || p.meta_description.length > 160) fail(`meta description ${p.meta_description.length}`);
    if (!has(p.meta_title)) fail('keyword missing from meta title');
    if (!has(p.meta_description)) fail('keyword missing from meta description');
    if (p.excerpt.length < 60) fail('excerpt too short');
    const words = plain(p.body).split(/\s+/).filter(Boolean).length;
    if (words < 600) fail(`only ${words} words`);
    const h2 = [...p.body.matchAll(/^## (.*)$/gm)].map((m) => m[1]);
    if (h2.length < 3) fail('fewer than 3 H2s');
    if (!h2.some(has)) fail('keyword missing from every H2');
    if (!has(p.body.split(/\s+/).slice(0, 100).join(' '))) fail('keyword missing from first 100 words');
    const paras = p.body.split(/\n\n/).filter(has).length;
    if (paras < 2 || paras > 12) fail(`keyword in ${paras} paragraphs`);
    if (!/frequently asked|faq/i.test(p.body)) fail('no FAQ section');
  }
});

test('internal links only point at pages that exist when the article goes live', () => {
  const live = new Set(SEED_POSTS.map((p) => p.slug));
  for (const p of queue) {
    const links = [...p.body.matchAll(/\]\((\/[^)#\s]*)/g)].map((m) => m[1]);
    assert.ok(links.length >= 2, `${p.slug}: fewer than 2 internal links`);
    for (const l of links) {
      const ok = fixedPages.has(l)
        || (l.startsWith('/blog/') && live.has(l.slice(6)))
        || (l.startsWith('/guides/') && guideSlugs.has(l.slice(8)))
        || (l.startsWith('/services/') && tradeSlugs.has(l.slice(10)));
      assert.ok(ok, `${p.slug}: broken or not-yet-published link ${l}`);
    }
    live.add(p.slug);
  }
});
