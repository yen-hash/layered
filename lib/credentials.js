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

// Compact badges for directory cards.
export function credentialBadges(b) {
  const out = [];
  if (b.hdb_licence_no) out.push('<span class="badge badge-hdb">HDB licensed</span>');
  if (b.casetrust) {
    const gold = b.casetrust === 'casetrust_gold';
    out.push(`<span class="badge ${gold ? 'badge-gold' : 'badge-casetrust'}">${esc(CASETRUST_LABELS[b.casetrust])}</span>`);
  }
  return out.length ? `<div class="badge-row">${out.join('')}</div>` : '';
}

// Fuller block for the profile page, with the self-declared note and lookup links.
export function credentialsPanel(b) {
  if (!hasCredentials(b)) return '';
  const rows = [];
  if (b.hdb_licence_no) {
    rows.push(`<li><span class="badge badge-hdb">HDB licensed</span> Licence no. <strong>${esc(b.hdb_licence_no)}</strong> <a href="${HDB_LOOKUP_URL}" target="_blank" rel="noopener noreferrer">Check on HDB →</a></li>`);
  }
  if (b.casetrust) {
    const gold = b.casetrust === 'casetrust_gold';
    rows.push(`<li><span class="badge ${gold ? 'badge-gold' : 'badge-casetrust'}">${esc(CASETRUST_LABELS[b.casetrust])}</span> accredited renovation business <a href="${CASETRUST_LOOKUP_URL}" target="_blank" rel="noopener noreferrer">Check on CaseTrust →</a></li>`);
  }
  return `
  <div class="credentials panel">
    <h3>Credentials</h3>
    <ul>${rows.join('')}</ul>
    <p class="muted small">Self-declared by the firm and not verified by Layered. Please confirm the details on the official lookups before signing a contract.</p>
  </div>`;
}
