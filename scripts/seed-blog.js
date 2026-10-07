// scripts/seed-blog.js — publishes the launch articles in content/posts.js.
//
// Idempotent and safe to run on every start:
//   * a seed article is inserted only if its slug has never been seeded before and no post
//     already uses it, so articles you delete or edit in the admin editor stay that way;
//   * new articles added to content/posts.js in a later release are picked up automatically.
import { db } from '../db.js';
import fs from 'node:fs';
import path from 'node:path';
import { SEED_POSTS } from '../content/posts.js';
import { publishDue } from '../lib/schedule.js';

// Articles in content/queue/*.js are drip-published: one a day at 08:30 Singapore time (00:30 UTC),
// starting tomorrow, in file and array order, after anything already scheduled.
const QUEUE_DIR = new URL('../content/queue/', import.meta.url);
const queued = [];
for (const f of fs.readdirSync(QUEUE_DIR).filter((n) => n.endsWith('.js')).sort()) {
  const mod = await import(new URL(f, QUEUE_DIR));
  queued.push(...(mod.QUEUE || []));
}

db.exec('CREATE TABLE IF NOT EXISTS seeded_posts (slug TEXT PRIMARY KEY)');

// The first release seeded these six before seeded_posts existed. On a database that already has
// posts but no tracking yet, treat them as seeded so deleted ones are not resurrected.
const FIRST_BATCH = [
  'qanvast-vs-hometrust-vs-layered', 'bto-renovation-timeline-singapore', 'hdb-kitchen-renovation-cost-singapore',
  'hdb-bathroom-renovation-cost-singapore', 'renovation-package-vs-custom-design-singapore', 'japandi-interior-design-singapore',
];
const mark = db.prepare('INSERT OR IGNORE INTO seeded_posts (slug) VALUES (?)');
const trackedCount = db.prepare('SELECT COUNT(*) c FROM seeded_posts').get().c;
const postCount = db.prepare('SELECT COUNT(*) c FROM posts').get().c;
if (trackedCount === 0 && postCount > 0) FIRST_BATCH.forEach((s) => mark.run(s));

const seeded = new Set(db.prepare('SELECT slug FROM seeded_posts').all().map((r) => r.slug));
const taken = new Set(db.prepare('SELECT slug FROM posts').all().map((r) => r.slug));
const insert = db.prepare(`INSERT INTO posts (slug, title, excerpt, body, category, tags, focus_keyword, meta_title, meta_description, cover_image, cover_alt, author_name, status, published_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Layered Editorial', 'published', ?, ?, ?)`);

const base = Date.now();
let added = 0;
SEED_POSTS.forEach((p, i) => {
  if (seeded.has(p.slug)) return;
  mark.run(p.slug);
  if (taken.has(p.slug)) return;
  // Later entries in the file are newer, so they sort first on the blog.
  const ts = new Date(base + i * 60000).toISOString().replace('T', ' ').slice(0, 19);
  insert.run(p.slug, p.title, p.excerpt, p.body, p.category, p.tags, p.focus_keyword, p.meta_title, p.meta_description, p.cover_image || '', p.cover_alt || '', ts, ts, ts);
  added++;
});

const pad = (n) => String(n).padStart(2, '0');
const stamp = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} 00:30:00`;
const lastDrip = db.prepare("SELECT MAX(published_at) AS m FROM posts WHERE status = 'scheduled'").get().m;
let day = lastDrip ? new Date(lastDrip.replace(' ', 'T') + 'Z') : new Date();
const insertQ = db.prepare(`INSERT INTO posts (slug, title, excerpt, body, category, tags, focus_keyword, meta_title, meta_description, cover_image, cover_alt, author_name, status, published_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Layered Editorial', 'scheduled', ?, datetime('now'), datetime('now'))`);
let queuedAdded = 0;
for (const p of queued) {
  if (seeded.has(p.slug)) continue;
  mark.run(p.slug);
  if (taken.has(p.slug)) continue;
  day = new Date(day.getTime() + 24 * 3600 * 1000);
  insertQ.run(p.slug, p.title, p.excerpt, p.body, p.category, p.tags, p.focus_keyword, p.meta_title, p.meta_description, p.cover_image || '', p.cover_alt || '', stamp(day));
  queuedAdded++;
}
const published = publishDue();
console.log(added ? `Seeded ${added} blog post(s).` : 'Blog seed: nothing new to add.', queuedAdded ? `Queued ${queuedAdded} article(s) for daily publishing.` : '', published ? `Published ${published} due.` : '');
