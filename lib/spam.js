// lib/spam.js — decides whether an enquiry is junk. Junk is kept aside for an admin to check (routes/enquiries.js), never
// emailed or sent to a firm, and never deleted early, so a mistake can be undone. Each reason adds points; 5 is junk.
// Rules lean towards letting enquiries through: a link, a foreign phone number or a short message is not junk by itself.
import { PROPERTY_TYPES, BUDGET_RANGES } from '../db.js';

// The choices on the landed form (routes/services.js).
const LANDED_BUDGETS = ['Below $500k', '$500k - $1M', '$1M - $2M', 'Above $2M'];

export const SPAM_SCORE = 5;
export const MIN_SECONDS = 3;

const PITCH = [
  /\bSEO\b|search engine (optimi[sz]ation|ranking)|\bGEO\b|generative engine/i,
  /search (visibility|index|results)|google'?s? search index|rank(s|ing|ed)? (is |are )?(not |low |higher |better |on |in )+\w*/i,
  /back ?links?\b|guest post|domain authority|website traffic|more traffic|boost your (website|site|online)/i,
  /(website|web) (re)?design (service|agency|compan|issue)|design-related issues|mobile app development|(redesign|rebuild) your (website|site)/i,
  /commercial (communication|offer|message)s?|contact forms?|feedback forms?|bulk (email|messag)|lead generation service/i,
  /instagram report|social media (marketing|management) (service|agency)|digital marketing (service|agency)|marketing agency/i,
  /lawful ways|outreach (service|campaign)|compliant(ly)? (way|outreach)|send (commercial|bulk) /i,
  /(your|the) (website|site)'?s? (visibility|ranking|performance)|checked your website|going through your website|visited your website|came across your (business|website|site)|people search online/i,
];

const words = (s) => String(s || '').split(/[^A-Za-z]+/).filter(Boolean);
const vowels = (w) => (w.match(/[aeiouy]/gi) || []).length / w.length;

function gibberish(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^[A-Z]{4,}\d{4,}[A-Z]{3,}$/.test(t.replace(/\s/g, ''))) return true; // MEYJTJ819674MARETR
  const w = words(t.replace(/https?:\S+|\S+@\S+|\b[\w-]+\.(com|sg|net|org)\b/gi, ' '));
  const odd = w.filter((x) => (x.length >= 17 && !/^(air|soft|fur|under|inter|counter|accommod)/i.test(x)) || (x.length >= 8 && vowels(x) < 0.15));
  return odd.length >= 1 && odd.length >= w.length * 0.3;
}

// fields: what the form posted. meta: { now, isLanded, siteHost }
export function spamCheck(fields, { now = Date.now(), isLanded = false, siteHost = 'layeredsg.com' } = {}) {
  const why = [];
  let score = 0;
  const add = (n, reason) => { score += n; why.push(reason); };
  const name = String(fields.name || '').trim();
  const msg = String(fields.message || '').trim();

  if (String(fields.hp_field || '').trim()) add(10, 'hidden field filled');
  if (fields.property_type && !PROPERTY_TYPES.includes(fields.property_type)) add(10, 'not a choice on the form');
  if (fields.budget_range && !(isLanded ? LANDED_BUDGETS : BUDGET_RANGES).includes(fields.budget_range)) add(10, 'not a choice on the form');
  const shown = Number(fields.shown);
  if (shown && now - shown < MIN_SECONDS * 1000 && now >= shown) add(3, 'sent within seconds');

  if (/^[\d\s.,'"()\\;<>=-]+$/.test(name)) add(5, 'name is not a name');
  if (/https?:|www\.|@/i.test(name)) add(5, 'link in the name');
  if (/(\bunion\b.+\bselect\b|\bor\b\s+\d+=\d+|<script|\bsleep\s*\(|\.\.\/\.\.\/)/i.test(`${name} ${msg}`)) add(10, 'attack pattern');
  if (gibberish(msg)) add(4, 'random letters');
  if (words(name).length === 1 && name.length >= 9 && vowels(name) < 0.2) add(3, 'random name');
  if (/^[A-Za-z]{3,}\d{4,}[A-Za-z]*$/.test(name)) add(3, 'name is a code');

  const host = siteHost.replace(/^www\./, '').toLowerCase();
  if (host && msg.toLowerCase().includes(host)) add(4, 'quotes our web address');
  const pitches = PITCH.filter((re) => re.test(msg)).length;
  if (pitches) add(Math.min(3 * pitches, 6), 'sales pitch');
  if (/\byour (web ?site|domain)\b/i.test(msg)) add(2, 'talks about our website');
  const links = (msg.match(/https?:\/\/|www\./gi) || []).length;
  if (links >= 3) add(3, 'many links');
  else if (links) add(1, 'link');
  const letters = (msg.match(/\p{L}/gu) || []).length;
  if (letters > 15 && (msg.match(/\p{Script=Cyrillic}/gu) || []).length / letters > 0.4) add(5, 'Russian text');
  return { spam: score >= SPAM_SCORE, score, why: why.join(', ') };
}
