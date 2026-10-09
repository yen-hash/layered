// lib/leadAccess.js — who may see a homeowner's contact details.
//
// A firm sees a lead's phone, email and full name only if it has access: a paid plan, an unexpired trial, or this
// one lead unlocked (unlocked_at). Otherwise everything contact-like is masked on the server, so it never reaches
// the page, the email or the SMS. Leads that no firm ever unlocked have their contact details wiped after
// PURGE_DAYS (see purgeStaleLeads), as the enquiry form tells the homeowner.

export const TRIAL_MONTHS = 3;
export const PURGE_DAYS = 90;

const toDate = (s) => new Date(String(s || '').replace(' ', 'T') + (String(s || '').includes('Z') ? '' : 'Z'));

// Trial end for a firm: the stored date, or three months after the account was created.
export function trialEnd(b) {
  if (b.trial_ends_at) return toDate(b.trial_ends_at);
  const d = toDate(b.created_at);
  if (Number.isNaN(d.getTime())) return new Date(0);
  d.setUTCMonth(d.getUTCMonth() + TRIAL_MONTHS);
  return d;
}

export function inTrial(b, now = new Date()) {
  return trialEnd(b).getTime() > now.getTime();
}

// Account-level access (paid plan or running trial).
export function hasAccountAccess(b, now = new Date()) {
  return b.plan === 'paid' || inTrial(b, now);
}

// Access to one lead match row (account access, or this lead was unlocked / delivered while the firm had access).
export function canSeeContact(b, match, now = new Date()) {
  return hasAccountAccess(b, now) || !!(match && match.unlocked_at);
}

export function maskEmail(email) {
  const [user = '', domain = ''] = String(email || '').split('@');
  if (!domain) return '••••••';
  return `${user.slice(0, 1)}•••@${domain.slice(0, 1)}•••`;
}

export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length <= 2 ? '••••' : `•••• ${'•'.repeat(Math.max(digits.length - 6, 0))}${digits.slice(-2)}`.replace(/\s+/g, ' ');
}

// "Jane Tan" -> "Jane T."
export function maskName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Homeowner';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}

// Homeowners sometimes type a phone number or email into the free-text message; hide those too.
export function scrubMessage(text) {
  return String(text || '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[hidden]')
    .replace(/(\+?\d[\d\s().-]{6,}\d)/g, '[hidden]')
    .replace(/https?:\/\/\S+/gi, '[hidden]');
}

// A copy of the lead row that is safe to show a firm without access.
export function maskLead(lead) {
  return { ...lead, name: maskName(lead.name), email: maskEmail(lead.email), phone: maskPhone(lead.phone), message: scrubMessage(lead.message), masked: true };
}

export function visibleLead(lead, b, match, now = new Date()) {
  return canSeeContact(b, match, now) ? { ...lead, masked: false } : maskLead(lead);
}

// Wipe contact details from enquiries nobody unlocked. Returns how many were wiped.
export function purgeStaleLeads(db) {
  const info = db.prepare(`UPDATE leads SET name = 'Homeowner', email = '', phone = '', message = '', purged_at = datetime('now')
    WHERE purged_at IS NULL AND email != '' AND created_at < datetime('now', ?) AND NOT EXISTS (SELECT 1 FROM lead_matches lm WHERE lm.lead_id = leads.id AND lm.unlocked_at != '')`)
    .run(`-${PURGE_DAYS} days`);
  return Number(info.changes || 0);
}
