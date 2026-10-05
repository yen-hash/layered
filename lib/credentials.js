// lib/credentials.js — trade credentials a renovation firm can list on its profile.
//
// HDB: firms on HDB's Directory of Renovation Contractors hold a licence number
//      (homeowners can look it up, with status and expiry, on HDB e-Services).
// CaseTrust: the Consumers Association of Singapore's accreditation. Renovation firms
//      hold either plain CaseTrust, or CaseTrust-RCMA (the joint scheme for members of
//      the Renovation Contractors & Material Suppliers Association), and Gold is the
//      top tier. A firm holds one of these at a time.
//
// Everything here is self-declared by the firm; the UI says so and links to the
// official lookups rather than implying Layered has verified it.
import { esc } from './render.js';

export const CASETRUST_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'casetrust', label: 'CaseTrust' },
  { value: 'casetrust_rcma', label: 'CaseTrust-RCMA' },
  { value: 'casetrust_gold', label: 'CaseTrust Gold' },
];

const CASETRUST_LABELS = Object.fromEntries(CASETRUST_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]));

export const HDB_LOOKUP_URL = 'https://services2.hdb.gov.sg/webapp/BN31AWERRCMobile/BN31PContractorDetail.jsp';
export const CASETRUST_LOOKUP_URL = 'https://www.case.org.sg/casetrust/';

// Deliberately loose: HDB's number format isn't something we should hard-code and
// reject real licences over. This just keeps junk and markup out.
const HDB_LICENCE_RE = /^[A-Z0-9][A-Z0-9 \-/]{2,29}$/;

export function normaliseHdbLicence(raw) {
  const v = String(raw || '').trim().replace(/\s+/g, ' ').toUpperCase();
  if (!v) return { value: '' };
  if (!HDB_LICENCE_RE.test(v)) return { error: 'HDB licence number can only contain letters, numbers, spaces, "-" and "/" (3–30 characters).' };
  return { value: v };
}

export function normaliseCaseTrust(raw) {
  const v = String(raw || '');
  return CASETRUST_LABELS[v] ? v : '';
}

export function hasCredentials(b) {
  return Boolean(b.hdb_licence_no || b.casetrust);
}

// ---- Verification -------------------------------------------------------------------------
// An admin checks the firm against HDB's and CASE's own lookups and records what they saw. A mark is
// valid only while (a) the firm's current value still equals the value that was checked, and (b) the
// check is recent. Changing a licence number or tier therefore voids the mark with no extra step.
export const VERIFICATION_MAX_AGE_DAYS = 365;
const DAY = 86400000;

// Returns the ISO date (YYYY-MM-DD) of a valid verification, or '' if none.
export function verifiedOn(b, kind, now = Date.now()) {
  const current = kind === 'hdb' ? b.hdb_licence_no : b.casetrust;
  const checked = kind === 'hdb' ? b.hdb_verified_value : b.casetrust_verified_value;
  const at = kind === 'hdb' ? b.hdb_verified_at : b.casetrust_verified_at;
  if (!current || !checked || current !== checked || !at) return '';
  const t = Date.parse(String(at).replace(' ', 'T') + (String(at).includes('T') || String(at).endsWith('Z') ? '' : 'Z'));
  if (!Number.isFinite(t) || now - t > VERIFICATION_MAX_AGE_DAYS * DAY || t > now + DAY) return '';
  return new Date(t).toISOString().slice(0, 10);
}

export const isAnyVerified = (b) => Boolean(verifiedOn(b, 'hdb') || verifiedOn(b, 'casetrust'));

const TICK = '<svg class="tick" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const niceDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function badge(cls, label, verifiedIso) {
  return verifiedIso
    ? `<span class="badge ${cls} badge-verified" title="Checked by Layered against the official lookup on ${esc(niceDate(verifiedIso))}">${TICK}${esc(label)}<span class="sr-only"> (verified ${esc(niceDate(verifiedIso))})</span></span>`
    : `<span class="badge ${cls}">${esc(label)}</span>`;
}

// Compact badges for directory cards.
export function credentialBadges(b) {
  const out = [];
  if (b.hdb_licence_no) out.push(badge('badge-hdb', 'HDB licensed', verifiedOn(b, 'hdb')));
  if (b.casetrust) {
    const gold = b.casetrust === 'casetrust_gold';
    out.push(badge(gold ? 'badge-gold' : 'badge-casetrust', CASETRUST_LABELS[b.casetrust], verifiedOn(b, 'casetrust')));
  }
  return out.length ? `<div class="badge-row">${out.join('')}</div>` : '';
}

// Fuller block for the profile page. Says exactly what was and was not checked.
export function credentialsPanel(b) {
  if (!hasCredentials(b)) return '';
  const rows = [];
  const hv = b.hdb_licence_no ? verifiedOn(b, 'hdb') : '';
  const cv = b.casetrust ? verifiedOn(b, 'casetrust') : '';
  if (b.hdb_licence_no) {
    rows.push(`<li>${badge('badge-hdb', 'HDB licensed', hv)} Licence no. <strong>${esc(b.hdb_licence_no)}</strong> ${hv ? `<span class="muted small">Verified ${esc(niceDate(hv))}</span> ` : ''}<a href="${HDB_LOOKUP_URL}" target="_blank" rel="noopener noreferrer">Check on HDB →</a></li>`);
  }
  if (b.casetrust) {
    const gold = b.casetrust === 'casetrust_gold';
    rows.push(`<li>${badge(gold ? 'badge-gold' : 'badge-casetrust', CASETRUST_LABELS[b.casetrust], cv)} accredited renovation business ${cv ? `<span class="muted small">Verified ${esc(niceDate(cv))}</span> ` : ''}<a href="${CASETRUST_LOOKUP_URL}" target="_blank" rel="noopener noreferrer">Check on CaseTrust →</a></li>`);
  }
  const declared = [b.hdb_licence_no, b.casetrust].filter(Boolean).length;
  const verified = [hv, cv].filter(Boolean).length;
  let note;
  if (verified === 0) note = 'Self-declared by the firm and not verified by Layered. Please confirm the details on the official lookups before signing a contract.';
  else if (verified === declared) note = 'Checked by Layered against the official lookups on the dates shown. Registrations can lapse or change, so confirm they are still current before you sign a contract.';
  else note = 'Items marked verified were checked by Layered against the official lookups on the dates shown. The rest are self-declared by the firm. Please confirm everything on the official lookups before signing a contract.';
  const deposit = b.casetrust
    ? '<p class="muted small">CASE requires CaseTrust-accredited renovation businesses to hold a deposit performance bond that safeguards homeowners\' deposits if the firm closes or is wound up, and to cap the initial deposit (CASE states 20% of the contract). Layered does not check bonds, so ask the firm for its bond details and read the contract.</p>'
    : '';
  return `
  <div class="credentials panel">
    <h3>Credentials</h3>
    <ul>${rows.join('')}</ul>
    <p class="muted small">${note}</p>
    ${deposit}
  </div>`;
}
