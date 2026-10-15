// lib/duplicates.js — spot firms that were listed twice (for example the owner signs up again after an admin
// created the profile). Flagging only: deleting is always a human decision in Dashboard > Accounts.

const GENERIC = new Set(['pte', 'ltd', 'limited', 'llp', 'the', 'and', 'co', 'company', 'design', 'designs', 'designer', 'designers', 'interior', 'interiors', 'studio', 'studios', 'associates', 'group', 'singapore', 'sg']);

// "Mu Design Studio Pte. Ltd." and "MU Interior" both become "mu".
export function nameKey(name) {
  const words = String(name || '').toLowerCase().replace(/&/g, ' and ').split(/[^a-z0-9一-鿿]+/).filter(Boolean);
  const core = words.filter((w) => !GENERIC.has(w));
  return (core.length ? core : words).join(' ');
}

// Last 8 digits of a Singapore number, ignoring +65 and spacing. Empty when there is no usable number.
export function phoneKey(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length >= 8 ? d.slice(-8) : '';
}

// The existing firm a new signup would duplicate, matched on company name only (phone is flagged, not blocked,
// because one group can run several brands from the same number).
export function findNameDuplicate(db, companyName) {
  const key = nameKey(companyName);
  if (!key) return null;
  return db.prepare('SELECT id, company_name, slug FROM businesses').all().find((b) => nameKey(b.company_name) === key) || null;
}

// Groups of firms that look like the same business: id -> reasons. Only firms in a group of 2+ are returned.
export function duplicateFlags(firms) {
  const flags = new Map();
  const add = (list, why) => {
    if (list.length < 2) return;
    for (const f of list) {
      const others = list.filter((o) => o.id !== f.id).map((o) => o.company_name);
      flags.set(f.id, [...(flags.get(f.id) || []), `${why}: ${others.join(', ')}`]);
    }
  };
  const group = (keyFn) => {
    const m = new Map();
    for (const f of firms) { const k = keyFn(f); if (k) m.set(k, [...(m.get(k) || []), f]); }
    return [...m.values()];
  };
  group((f) => nameKey(f.company_name)).forEach((g) => add(g, 'Same name as'));
  group((f) => phoneKey(f.phone)).forEach((g) => add(g, 'Same phone as'));
  return flags;
}
