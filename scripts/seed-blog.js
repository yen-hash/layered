// scripts/seed-blog.js — publishes the launch articles in content/posts.js.
//
// Idempotent and safe to run on every start:
//   * a seed article is inserted only if its slug has never been seeded before and no post
//     already uses it, so articles you delete or edit in the admin editor stay that way;
//   * new articles added to content/posts.js in a later release are picked up automatically.
import { db } from '../db.js';
import { SEED_POSTS } from '../content/posts.js';

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
console.log(added ? `Seeded ${added} blog post(s).` : 'Blog seed: nothing new to add.');
