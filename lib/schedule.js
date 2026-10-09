// lib/schedule.js — drip publishing. Queued articles are stored with status 'scheduled' and a future
// published_at (UTC); publishDue() flips the ones that are due to 'published'. Scheduled posts are
// hidden everywhere (blog, sitemap, RSS) exactly like drafts, until they flip.
import { db } from '../db.js';
import { purgeStaleLeads } from './leadAccess.js';

export function publishDue() {
  const info = db.prepare("UPDATE posts SET status = 'published', updated_at = datetime('now') WHERE status = 'scheduled' AND published_at <= datetime('now')").run();
  return Number(info.changes || 0);
}

// Hourly is plenty: an article goes live within the hour of its scheduled time.
export function startPublisher() {
  const run = () => {
    try {
      const n = publishDue();
      if (n) console.log(`Published ${n} scheduled article${n === 1 ? '' : 's'}.`);
      const w = purgeStaleLeads(db);
      if (w) console.log(`Wiped contact details from ${w} enquir${w === 1 ? 'y' : 'ies'} nobody unlocked.`);
    } catch (err) { console.error('scheduled publish failed', err); }
  };
  run();
  const t = setInterval(run, 60 * 60 * 1000);
  t.unref();
}
