// lib/leadRouting.js — who receives a general interior design enquiry, and when.
//
// Carpenters (the "house firm", same owner as Layered) gets it alone for 24 hours. After that, at most two other approved
// firms get it, and only if the homeowner ticked the sharing box. Nothing is released if Carpenters won it, the homeowner
// asked us to stop, or it is too old. A lead is released once only: released_at is claimed before any firm is added.
// Enquiries sent from one firm's profile, trades and landed briefs do not pass through here.
import { hasAccountAccess, maskLead } from './leadAccess.js';
import { dispatchLeadNotifications, sendEmail } from './notify.js';
import { adminEmails } from './admin.js';

export const HEAD_START_HOURS = 24;
export const MAX_OTHER_FIRMS = 2;
export const RELEASE_WITHIN_DAYS = 7; // e.g. the server was off: a stale enquiry is not sprung on other firms later

export const sqlTime = (d) => d.toISOString().replace('T', ' ').slice(0, 19);
const fromSql = (s) => new Date(`${String(s).replace(' ', 'T')}Z`);

export function houseFirm(db) {
  return db.prepare('SELECT * FROM businesses WHERE house_firm = 1 AND approved = 1 ORDER BY id LIMIT 1').get() || null;
}

// Add one firm to a lead and notify it. Firms with a plan or running trial get full details, the rest a masked copy.
export function deliverLead(db, lead, business, now = new Date()) {
  const open = hasAccountAccess(business, now);
  db.prepare('INSERT INTO lead_matches (lead_id, business_id, unlocked_at) VALUES (?, ?, ?)').run(lead.id, business.id, open ? sqlTime(now) : '');
  dispatchLeadNotifications(business, open ? lead : maskLead(lead), { locked: !open }).catch((err) => console.error('notify error', err));
}

function tellAdmins(subject, text) {
  for (const to of adminEmails()) sendEmail({ to, subject, text }).catch((err) => console.error('notify error', err));
}

const startClock = (db, lead, now) => {
  if (lead.share_ok) db.prepare('UPDATE leads SET release_at = ? WHERE id = ?').run(sqlTime(new Date(now.getTime() + HEAD_START_HOURS * 3600e3)), lead.id);
};

// A new general design enquiry: to Carpenters, or held if its account cannot be found (never to other firms instead).
export function routeDesignLead(db, lead, now = new Date()) {
  const house = houseFirm(db);
  if (!house) {
    db.prepare('UPDATE leads SET held = 1 WHERE id = ?').run(lead.id);
    console.error(`[routing] lead #${lead.id} held: no approved house firm`);
    tellAdmins('Layered: an enquiry is on hold', `Enquiry #${lead.id} could not be sent because the Carpenters account was not found. It has not been sent to any other firm. See Enquiries (admin).`);
    return 'held';
  }
  startClock(db, lead, now);
  deliverLead(db, lead, house, now);
  return 'house';
}

// Held enquiries go out once the Carpenters account is back. The 24 hours start then.
export function deliverHeld(db, now = new Date()) {
  const house = houseFirm(db);
  if (!house) return 0;
  let n = 0;
  for (const lead of db.prepare('SELECT * FROM leads WHERE held = 1 AND purged_at IS NULL').all()) {
    if (!db.prepare('UPDATE leads SET held = 0 WHERE id = ? AND held = 1').run(lead.id).changes) continue;
    startClock(db, lead, now);
    deliverLead(db, lead, house, now);
    n += 1;
  }
  return n;
}

function otherFirms(db, propertyType) {
  const type = String(propertyType || '');
  return db.prepare(`SELECT * FROM businesses WHERE category = 'interior-design' AND approved = 1 AND house_firm = 0
    AND (? = '' OR (',' || property_types || ',') LIKE ?) ORDER BY featured DESC, created_at DESC LIMIT ?`).all(type, `%,${type},%`, MAX_OTHER_FIRMS);
}

// Share one lead with other firms if every condition holds. `early` skips the 24-hour wait (Carpenters said not for us).
// Returns how many firms received it.
export function releaseLead(db, id, { now = new Date(), early = false } = {}) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!lead || !lead.share_ok || !lead.release_at || lead.released_at || lead.purged_at) return 0;
  if (!early && fromSql(lead.release_at) > now) return 0;
  if (now - fromSql(lead.created_at) > RELEASE_WITHIN_DAYS * 86400e3) return 0;
  const house = db.prepare('SELECT lm.status FROM lead_matches lm JOIN businesses b ON b.id = lm.business_id WHERE lm.lead_id = ? AND b.house_firm = 1').get(id);
  if (!house || house.status === 'won') return 0;
  // Claim it first, so a second run or a restart cannot release it again.
  if (!db.prepare('UPDATE leads SET released_at = ? WHERE id = ? AND released_at IS NULL AND share_ok = 1').run(sqlTime(now), id).changes) return 0;
  const firms = otherFirms(db, lead.property_type);
  for (const f of firms) deliverLead(db, lead, f, now);
  return firms.length;
}

// Hourly: share every lead whose 24 hours are up. Returns how many leads reached at least one firm.
export function releaseDue(db, now = new Date()) {
  const due = db.prepare('SELECT id FROM leads WHERE share_ok = 1 AND released_at IS NULL AND purged_at IS NULL AND release_at IS NOT NULL AND release_at <= ?').all(sqlTime(now));
  return due.filter((l) => releaseLead(db, l.id, { now }) > 0).length;
}

// An admin says a held enquiry is real: send it where it would have gone, as it would have gone. `matchLead` is passed in
// (routes/public.js) so trades and landed briefs use the same rules as a normal enquiry. Returns false if nothing was held.
export function notSpam(db, id, matchLead, now = new Date()) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND spam = 1').get(id);
  if (!lead) return false;
  db.prepare("UPDATE leads SET spam = 0 WHERE id = ? AND spam = 1").run(id);
  const route = String(lead.spam_route || '');
  if (route.startsWith('direct:')) {
    const f = db.prepare('SELECT * FROM businesses WHERE slug = ? AND approved = 1').get(route.slice(7));
    if (f) deliverLead(db, lead, f, now);
  } else if (route === 'house') {
    startClock(db, lead, now);
    routeDesignLead(db, lead, now);
  } else {
    for (const f of matchLead(lead.category)) deliverLead(db, lead, f, now);
  }
  return true;
}

// The homeowner withdrew consent: this lead is never released.
export function stopSharing(db, id) {
  return Number(db.prepare('UPDATE leads SET share_ok = 0 WHERE id = ? AND released_at IS NULL').run(id).changes);
}

// One line for the dashboard and the admin page.
export function sharingState(lead, now = new Date()) {
  if (lead.spam) return `Held as spam: ${lead.spam_why || 'looks like junk'}`;
  if (lead.held) return 'On hold: Carpenters account not found';
  if (lead.purged_at) return 'Contact details deleted';
  if (lead.released_at) return `Shared ${lead.released_at} UTC`;
  if (!lead.share_ok) return 'Not shared with other firms';
  if (!lead.release_at) return 'Not shared yet';
  if (now - fromSql(lead.created_at) > RELEASE_WITHIN_DAYS * 86400e3) return 'Too old to share';
  return `May be shared from ${lead.release_at} UTC unless won`;
}
