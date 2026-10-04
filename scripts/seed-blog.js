// scripts/seed-blog.js — publishes the launch articles the first time the blog is empty.
// Safe to re-run: it does nothing once any post exists, so deleting a seeded article sticks.
import { db } from '../db.js';
import { SEED_POSTS } from '../content/posts.js';

const existing = db.prepare('SELECT COUNT(*) c FROM posts').get().c;
if (existing > 0) {
  console.log(`Skipping blog seed — ${existing} post(s) already exist.`);
  process.exit(0);
}

const insert = db.prepare(`INSERT INTO posts (slug, title, excerpt, body, category, tags, focus_keyword, meta_title, meta_description, cover_image, cover_alt, author_name, status, published_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Layered Editorial', 'published', ?, ?, ?)`);
const base = Date.now();
// Oldest first, so the first article in the list is the newest by published_at.
[...SEED_POSTS].reverse().forEach((p, i) => {
  const ts = new Date(base + i * 60000).toISOString().replace('T', ' ').slice(0, 19);
  insert.run(p.slug, p.title, p.excerpt, p.body, p.category, p.tags, p.focus_keyword, p.meta_title, p.meta_description, p.cover_image || '', p.cover_alt, ts, ts, ts);
});
console.log(`Seeded ${SEED_POSTS.length} blog posts.`);
