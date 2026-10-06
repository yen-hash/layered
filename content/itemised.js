// content/itemised.js — data and maths for the itemised renovation cost estimator.
//
// Unit rates are supply-and-install ranges published by Singapore renovation contractors and cost
// guides in 2026 (sources listed in SOURCES and on the page). They are indicative, not quotes. Change
// a rate here only: the page, the browser script and the tests all read from ITEMS.
// `itemisedEstimate` and `presetQuantities` are self-contained so the identical code runs on the server
// (tests) and in the browser (serialised with Function.prototype.toString).

export const ITEMS_REVIEWED = '2026-10-06';

export const HOMES = {
  hdb3: { label: '3-room HDB' },
  hdb4: { label: '4-room HDB' },
  hdb5: { label: '5-room HDB' },
  condo: { label: 'Condo apartment' },
};

// unit: what the quantity counts. range: [low, high] S$ per unit. rangeBy: per-home range for whole-home items.
export const ITEMS = [
  { group: 'Hacking & disposal', items: [
    { key: 'hackFloor', label: 'Hack existing floor tiles', unit: 'sq ft', range: [4.5, 6.5] },
    { key: 'hackWall', label: 'Hack non-structural wall (check HDB rules first)', unit: 'sq ft', range: [6, 10] },
    { key: 'disposal', label: 'Debris disposal (per lorry trip)', unit: 'trip', range: [300, 500] },
  ] },
  { group: 'Flooring', items: [
    { key: 'vinyl', label: 'Vinyl (SPC) flooring, supply and install', unit: 'sq ft', range: [4.5, 9] },
    { key: 'tileOverlay', label: 'Floor tile overlay on existing tiles', unit: 'sq ft', range: [3, 9] },
    { key: 'floorTiles', label: 'New floor tiles (laying, after hacking)', unit: 'sq ft', range: [6, 12] },
  ] },
  { group: 'Bathrooms & wet works', items: [
    { key: 'bathRetile', label: 'Bathroom hack and retile, with waterproofing', unit: 'bathroom', range: [3100, 4700] },
    { key: 'bathFittings', label: 'Sanitary fittings set (WC, basin, shower mixer)', unit: 'bathroom', range: [2000, 4500] },
    { key: 'vanity', label: 'Vanity cabinet with basin', unit: 'unit', range: [850, 1500] },
    { key: 'showerScreen', label: 'Shower screen (tempered glass)', unit: 'unit', range: [600, 1500] },
    { key: 'wallTiles', label: 'Wall tiling (e.g. kitchen walls)', unit: 'sq ft', range: [6, 12] },
  ] },
  { group: 'Kitchen', items: [
    { key: 'kitchenBase', label: 'Kitchen bottom cabinets', unit: 'ft run', range: [180, 360] },
    { key: 'kitchenTop', label: 'Kitchen top-hung cabinets', unit: 'ft run', range: [140, 195] },
    { key: 'quartz', label: 'Quartz countertop', unit: 'ft run', range: [90, 150] },
  ] },
  { group: 'Carpentry', items: [
    { key: 'wardrobe', label: 'Built-in wardrobe (full height)', unit: 'ft run', range: [200, 360] },
    { key: 'shoeCabinet', label: 'Shoe cabinet', unit: 'ft run', range: [150, 300] },
    { key: 'tvConsole', label: 'TV console', unit: 'ft run', range: [170, 320] },
    { key: 'studyTable', label: 'Study table', unit: 'ft run', range: [140, 200] },
    { key: 'platformBed', label: 'Platform bed with storage', unit: 'bed', range: [1500, 2500] },
    { key: 'featureWall', label: 'Laminate feature wall', unit: 'sq ft', range: [15, 25] },
  ] },
  { group: 'Ceiling & lighting', items: [
    { key: 'ceiling', label: 'Plaster false ceiling', unit: 'sq ft', range: [8, 15] },
    { key: 'cove', label: 'Cove light box with LED strip', unit: 'ft run', range: [26, 50] },
  ] },
  { group: 'Electrical & plumbing', items: [
    { key: 'rewire', label: 'Full rewiring of the home', unit: 'home', rangeBy: { hdb3: [1500, 2500], hdb4: [1800, 3500], hdb5: [2500, 4500] } },
    { key: 'lightPoint', label: 'New lighting point (with switch)', unit: 'point', range: [120, 220] },
    { key: 'powerPoint', label: 'New power point (13A)', unit: 'point', range: [80, 160] },
    { key: 'aircon', label: 'Aircon isolator point', unit: 'point', range: [100, 200] },
    { key: 'heater', label: 'Water heater installation', unit: 'unit', range: [100, 250] },
  ] },
  { group: 'Painting', items: [
    { key: 'paint', label: 'Paint the whole home (sealer and 2 coats)', unit: 'home', rangeBy: { hdb3: [1600, 3500], hdb4: [1750, 4500], hdb5: [1900, 5000], condo: [2000, 5000] } },
    { key: 'paintRoom', label: 'Paint a single room', unit: 'room', range: [250, 450] },
  ] },
  { group: 'Doors, gates & windows', items: [
    { key: 'bedroomDoor', label: 'Laminate bedroom door', unit: 'door', range: [250, 730] },
    { key: 'mainDoor', label: 'Main door (laminate)', unit: 'door', range: [850, 1250] },
    { key: 'gate', label: 'Main gate (metal)', unit: 'gate', range: [700, 1050] },
    { key: 'grilles', label: 'Window grilles (aluminium)', unit: 'sq ft', range: [8, 12] },
  ] },
];

// Typical starting quantities. These are our assumptions for a common scope, not published figures,
// and every one can be edited on the page.
export const PRESETS = {
  bto: {
    hdb3: { vinyl: 450, kitchenBase: 10, kitchenTop: 8, quartz: 10, wardrobe: 14, shoeCabinet: 4, tvConsole: 8, platformBed: 1, featureWall: 40, ceiling: 100, cove: 30, lightPoint: 4, powerPoint: 6, aircon: 3, heater: 2, paint: 1, gate: 1, grilles: 60, disposal: 1 },
    hdb4: { vinyl: 600, kitchenBase: 12, kitchenTop: 10, quartz: 12, wardrobe: 20, shoeCabinet: 5, tvConsole: 10, studyTable: 6, platformBed: 1, featureWall: 60, ceiling: 150, cove: 40, lightPoint: 6, powerPoint: 8, aircon: 4, heater: 2, paint: 1, gate: 1, grilles: 80, disposal: 1 },
    hdb5: { vinyl: 750, kitchenBase: 14, kitchenTop: 12, quartz: 14, wardrobe: 24, shoeCabinet: 6, tvConsole: 12, studyTable: 6, platformBed: 1, featureWall: 60, ceiling: 200, cove: 50, lightPoint: 8, powerPoint: 10, aircon: 4, heater: 2, paint: 1, gate: 1, grilles: 100, disposal: 1 },
    condo: { vinyl: 650, kitchenTop: 8, wardrobe: 16, shoeCabinet: 4, tvConsole: 8, cove: 30, lightPoint: 6, powerPoint: 8, paint: 1, disposal: 1 },
  },
  resale: {
    hdb3: { hackFloor: 450, vinyl: 450, bathRetile: 2, bathFittings: 2, vanity: 2, kitchenBase: 10, kitchenTop: 8, quartz: 10, wallTiles: 60, wardrobe: 14, shoeCabinet: 4, tvConsole: 8, rewire: 1, lightPoint: 4, powerPoint: 6, aircon: 3, heater: 2, paint: 1, bedroomDoor: 2, mainDoor: 1, gate: 1, disposal: 3 },
    hdb4: { hackFloor: 600, vinyl: 600, bathRetile: 2, bathFittings: 2, vanity: 2, kitchenBase: 12, kitchenTop: 10, quartz: 12, wallTiles: 80, wardrobe: 20, shoeCabinet: 5, tvConsole: 10, rewire: 1, lightPoint: 6, powerPoint: 8, aircon: 4, heater: 2, paint: 1, bedroomDoor: 3, mainDoor: 1, gate: 1, disposal: 3 },
    hdb5: { hackFloor: 750, vinyl: 750, bathRetile: 2, bathFittings: 2, vanity: 2, kitchenBase: 14, kitchenTop: 12, quartz: 14, wallTiles: 90, wardrobe: 24, shoeCabinet: 6, tvConsole: 12, rewire: 1, lightPoint: 8, powerPoint: 10, aircon: 4, heater: 2, paint: 1, bedroomDoor: 3, mainDoor: 1, gate: 1, disposal: 4 },
    condo: { hackFloor: 650, vinyl: 650, bathRetile: 2, bathFittings: 2, vanity: 2, kitchenBase: 10, kitchenTop: 8, quartz: 10, wardrobe: 16, shoeCabinet: 4, tvConsole: 8, lightPoint: 6, powerPoint: 8, paint: 1, bedroomDoor: 2, disposal: 3 },
  },
};

export const CONTINGENCY = [0.10, 0.15];
export const GST = 0.09; // Singapore GST, charged by GST-registered firms

export const SOURCES = [
  ['Carpentry, kitchen, tiling, electrical points and painting', 'https://www.smartcalculator.sg/articles/renovation-quotation-guide-singapore-2026'],
  ['Wardrobes, TV console, shoe cabinet, study table, platform bed, feature wall', 'https://www.smartcalculator.sg/articles/carpentry-cost-singapore-2026'],
  ['Vinyl and tile flooring per square foot', 'https://www.smartcalculator.sg/articles/flooring-cost-singapore-2026'],
  ['Hacking and debris disposal', 'https://www.shiokliving.com/home-improvement/renovation-costs/hacking-cost-singapore/'],
  ['Rewiring, lighting, power, aircon and water heater points', 'https://homegenie.com.sg/blogs/news/bto-electrical-works-cost-singapore-2026'],
  ['False ceiling and cove lighting', 'https://renovationcontractorsingapore.com/blogs/news/false-ceiling-cove-lighting-cost-singapore-2026'],
  ['Bathroom waterproofing, fittings, vanity and shower screen', 'https://hockstar.sg/bathroom-renovation-cost-singapore/'],
  ['Whole-flat and per-room painting', 'https://www.sparkflow.com.sg/blog/hdb-painting-cost-singapore'],
  ['Main doors and gates', 'https://www.hddoor.com.sg/hdb-main-door-price-guide/'],
  ['Window grilles', 'https://www.hohodoorsingapore.com/window-grille-singapore'],
];

// input: { home: 'hdb4', qty: { key: number } }
// returns { ok, lines: [{ key, label, unit, qty, rate:[lo,hi], low, high }], low, high, suggestedLow, suggestedHigh, skipped: [labels] }
export function itemisedEstimate(input, ITEMS, CONTINGENCY) {
  var lines = [], skipped = [], low = 0, high = 0;
  var qty = input && input.qty ? input.qty : {};
  var home = input && input.home;
  var homes = { hdb3: 1, hdb4: 1, hdb5: 1, condo: 1 };
  if (!homes[home]) return { ok: false, error: 'Choose your type of home.' };
  for (var g = 0; g < ITEMS.length; g++) {
    for (var i = 0; i < ITEMS[g].items.length; i++) {
      var it = ITEMS[g].items[i];
      var q = Number(qty[it.key]);
      if (!isFinite(q) || q <= 0) continue;
      if (q > 100000) return { ok: false, error: 'Check the quantity for ' + it.label + '.' };
      var rate = it.rangeBy ? it.rangeBy[home] : it.range;
      if (!rate) { skipped.push(it.label); continue; }
      var lo = rate[0] * q, hi = rate[1] * q;
      lines.push({ key: it.key, group: ITEMS[g].group, label: it.label, unit: it.unit, qty: q, rate: rate, low: lo, high: hi });
      low += lo; high += hi;
    }
  }
  if (!lines.length) return { ok: false, error: 'Add a quantity to at least one item.' };
  return {
    ok: true, lines: lines, skipped: skipped, low: low, high: high,
    suggestedLow: Math.round(low * (1 + CONTINGENCY[0])),
    suggestedHigh: Math.round(high * (1 + CONTINGENCY[1])),
  };
}
