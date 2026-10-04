// content/estimator.js — data and maths for the renovation cost calculator.
//
// Every number below is a range quoted by Singapore renovation guides in 2026 (the same ranges used
// in the cost articles). They are indicative, not quotes, and the page says so. When a range
// is revised, change it here only: the static tables, the calculator and the tests all read from DATA.
// `estimate` is a pure, self-contained function so the identical code runs on the server (tests) and in the
// browser (it is serialised into the page with Function.prototype.toString).

export const DATA_REVIEWED = '2026-10-04';

export const DATA = {
  // HDB, standard specification, by flat type and condition. [low, high] in S$.
  hdb: {
    '3-room': { label: '3-room', bto: [30000, 45000], resale: [45000, 65000] },
    '4-room': { label: '4-room', bto: [40000, 55000], resale: [55000, 75000] },
    '5-room': { label: '5-room', bto: [45000, 67000], resale: [58000, 90000] },
  },
  // Published specification tiers exist for the 4-room only.
  hdbSpec4Room: {
    basic: { label: 'Basic', bto: [30000, 40000], resale: [40000, 55000] },
    standard: { label: 'Standard (most popular)', bto: [40000, 55000], resale: [55000, 75000] },
    premium: { label: 'Premium', bto: [55000, 75000], resale: [75000, 100000] }, // "and above"
  },
  // Condo, S$ per square foot. A null high means "and above": no published ceiling.
  condo: {
    cosmetic: { label: 'Cosmetic refresh (minimal hacking)', psf: [40, null] },
    full: { label: 'Full renovation', psf: [50, 120] },
    premium: { label: 'High specification (stone, feature joinery, smart home)', psf: [150, null] },
  },
  // Single rooms. [low, high]
  kitchen: {
    standard: { label: 'Standard HDB kitchen', range: [8000, 15000] },
    rebuild: { label: 'Full mid-range rebuild', range: [15000, 28000] },
    premium: { label: 'Premium or open-concept conversion', range: [28000, 45000] }, // "and above"
  },
  bathroom: {
    refresh: { label: 'Refresh (fittings, vanity; tiles stay)', range: [3000, 5000] },
    rebuild: { label: 'Standard rebuild (hack, retile, new waterproofing)', range: [5000, 8000] },
    redesign: { label: 'Full redesign with layout changes', range: [8000, 12000] }, // "and above"
    premium: { label: 'Premium (rain shower, frameless glass, designer fittings)', range: [20000, 40000] },
  },
  // Office fit-out, S$ per square foot.
  office: {
    basic: { label: 'Basic', psf: [60, 100] },
    mid: { label: 'Mid-range', psf: [100, 180] },
    premium: { label: 'Premium', psf: [180, 280] },
    hq: { label: 'Headquarters-grade', psf: [280, 450] },
  },
  buffer: [0.10, 0.15], // contingency recommended on top of the base range
};

// input shapes:
//   { mode: 'hdb', flat: '4-room', condition: 'bto'|'resale', spec: 'basic'|'standard'|'premium' }
//   { mode: 'condo', area: 900, tier: 'cosmetic'|'full'|'premium' }
//   { mode: 'rooms', kitchen: 'none'|<key>, bathrooms: 0-6, bathScope: <key> }
//   { mode: 'office', area: 1500, tier: <key> }
// returns { ok, low, high, openEnded, suggestedLow, suggestedHigh, notes[], propertyType } or { ok:false, error }
export function estimate(input, D) {
  var pair = null;
  var openEnded = false;
  var notes = [];
  var propertyType = '';
  var n = function (v) { var x = Number(v); return isFinite(x) ? x : NaN; };

  if (input.mode === 'hdb') {
    var flat = D.hdb[input.flat];
    if (!flat || (input.condition !== 'bto' && input.condition !== 'resale')) return { ok: false, error: 'Choose a flat type and whether it is BTO or resale.' };
    propertyType = 'HDB';
    if (input.flat === '4-room' && D.hdbSpec4Room[input.spec]) {
      pair = D.hdbSpec4Room[input.spec][input.condition];
      if (input.spec === 'premium') openEnded = true;
    } else {
      pair = flat[input.condition];
      notes.push('Published ranges for this flat type are for a standard specification.');
    }
    if (input.condition === 'resale') notes.push('Resale flats often need extra hacking, rewiring and re-waterproofing, which is why they cost more than BTO.');
  } else if (input.mode === 'condo') {
    var area = n(input.area);
    var t = D.condo[input.tier];
    if (!t || !(area >= 200 && area <= 10000)) return { ok: false, error: 'Enter your floor area in square feet (between 200 and 10,000).' };
    propertyType = 'Condo';
    var lowC = t.psf[0] * area;
    var highC = t.psf[1] === null ? null : t.psf[1] * area;
    if (highC === null) { pair = [lowC, lowC]; openEnded = true; } else { pair = [lowC, highC]; }
    notes.push('Condo renovations are usually priced per square foot, and the management corporation may require a refundable deposit on top.');
  } else if (input.mode === 'office') {
    var oa = n(input.area);
    var ot = D.office[input.tier];
    if (!ot || !(oa >= 200 && oa <= 100000)) return { ok: false, error: 'Enter your office area in square feet (between 200 and 100,000).' };
    propertyType = 'Commercial';
    pair = [ot.psf[0] * oa, ot.psf[1] * oa];
    notes.push('Furniture, IT, moving costs and end-of-lease reinstatement are usually separate from the fit-out price.');
  } else if (input.mode === 'rooms') {
    var count = Math.round(n(input.bathrooms));
    var k = input.kitchen === 'none' ? null : D.kitchen[input.kitchen];
    if (input.kitchen !== 'none' && !k) return { ok: false, error: 'Choose a kitchen scope.' };
    var b = D.bathroom[input.bathScope];
    if (!(count >= 0 && count <= 6)) return { ok: false, error: 'Choose between 0 and 6 bathrooms.' };
    if (count > 0 && !b) return { ok: false, error: 'Choose a bathroom scope.' };
    if (!k && count === 0) return { ok: false, error: 'Choose a kitchen scope or at least one bathroom.' };
    var lo = 0, hi = 0;
    if (k) { lo += k.range[0]; hi += k.range[1]; if (input.kitchen === 'premium') openEnded = true; }
    if (count > 0) { lo += b.range[0] * count; hi += b.range[1] * count; if (input.bathScope === 'redesign') openEnded = true; }
    pair = [lo, hi];
    notes.push('Room ranges cover the works in those rooms only, before any wider layout changes.');
  } else {
    return { ok: false, error: 'Unknown calculator mode.' };
  }

  var low = pair[0], high = pair[1];
  if (openEnded) notes.push('The published figures have no upper limit for this specification, so treat the high end as a minimum for the top of the range.');
  return {
    ok: true,
    low: low,
    high: high,
    openEnded: openEnded,
    suggestedLow: Math.round(low * (1 + D.buffer[0])),
    suggestedHigh: Math.round(high * (1 + D.buffer[1])),
    notes: notes,
    propertyType: propertyType,
  };
}

// Maps an amount to the lead form's budget bands so the calculator can pre-fill them.
export function budgetBand(amount) {
  if (amount < 20000) return 'Below $20k';
  if (amount < 50000) return '$20k - $50k';
  if (amount < 100000) return '$50k - $100k';
  return 'Above $100k';
}
