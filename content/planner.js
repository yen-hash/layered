// content/planner.js — catalogue, starter layouts and maths for the room planner.
//
// Everything is in metres. Starter layouts are our own approximate arrangements of a typical flat of each
// type, for people to edit; they are not HDB floor plans. `planQuantities` is self-contained so the same code
// runs on the server (tests) and in the browser (serialised into the page).

export const ROOM_TYPES = {
  living: { label: 'Living / dining', dry: true },
  bedroom: { label: 'Bedroom', dry: true },
  other: { label: 'Study / other dry room', dry: true },
  kitchen: { label: 'Kitchen', dry: false },
  bathroom: { label: 'Bathroom', dry: false },
  yard: { label: 'Service yard / balcony', dry: false },
};

// qty: the itemised estimator key this item adds to. measure: 'run' adds its long side in feet, 'count' adds 1.
export const CATALOG = {
  wardrobe: { label: 'Wardrobe', w: 1.8, h: 0.6, qty: 'wardrobe', measure: 'run', built: true },
  kitchenBase: { label: 'Kitchen base cabinet', w: 2.4, h: 0.6, qty: 'kitchenBase', measure: 'run', built: true },
  kitchenTop: { label: 'Top-hung cabinet', w: 2.4, h: 0.35, qty: 'kitchenTop', measure: 'run', built: true, wall: true },
  tvConsole: { label: 'TV console', w: 1.8, h: 0.4, qty: 'tvConsole', measure: 'run', built: true },
  shoeCabinet: { label: 'Shoe cabinet', w: 1.2, h: 0.4, qty: 'shoeCabinet', measure: 'run', built: true },
  studyTable: { label: 'Study table', w: 1.2, h: 0.6, qty: 'studyTable', measure: 'run', built: true },
  platformBed: { label: 'Platform bed', w: 2.0, h: 2.2, qty: 'platformBed', measure: 'count', built: true },
  sofa: { label: 'Sofa', w: 2.1, h: 0.9 },
  dining: { label: 'Dining table', w: 1.4, h: 0.8 },
  queenBed: { label: 'Queen bed', w: 1.6, h: 2.0 },
  singleBed: { label: 'Single bed', w: 1.0, h: 2.0 },
  fridge: { label: 'Fridge', w: 0.7, h: 0.7 },
  washer: { label: 'Washing machine', w: 0.6, h: 0.6 },
  // Openings snap onto room walls. Layout only: they are not priced from the plan.
  door: { label: 'Door', w: 0.85, h: 0.85, opening: 'door' },
  mainDoor: { label: 'Main door', w: 1.0, h: 1.0, opening: 'door' },
  slidingDoor: { label: 'Sliding door', w: 1.6, h: 0.15, opening: 'sliding' },
  window: { label: 'Window', w: 1.2, h: 0.15, opening: 'window' },
};

export const WALL = 0.15; // drawn wall and opening thickness, metres

const R = (name, type, x, y, w, h) => ({ name, type, x, y, w, h });
const I = (kind, x, y, w, h) => ({ kind, x, y, w, h });

// Adds doors and windows to a starter layout: one window on each living room, bedroom and kitchen's
// longest outside wall, a door from each other room into the room it shares the longest wall with
// (preferring the living room), and a main door on an outside wall of the living room.
function edges(r) {
  return [
    { o: 'h', at: r.y, from: r.x, to: r.x + r.w, rot: 0 },          // top wall, swing down into room
    { o: 'h', at: r.y + r.h, from: r.x, to: r.x + r.w, rot: 180 },  // bottom wall
    { o: 'v', at: r.x, from: r.y, to: r.y + r.h, rot: 270 },        // left wall
    { o: 'v', at: r.x + r.w, from: r.y, to: r.y + r.h, rot: 90 },   // right wall
  ];
}
// Which neighbour a door should open onto: corridor first, then living room, never a bedroom if avoidable.
const RANK = { Corridor: 6, living: 5, kitchen: 2, other: 1, yard: 0, bedroom: -2, bathroom: -3 };
function shared(e, rooms, self) {
  let best = null;
  for (const o of rooms) {
    if (o === self) continue;
    for (const f of edges(o)) {
      if (f.o !== e.o || Math.abs(f.at - e.at) > 0.01) continue;
      const a = Math.max(e.from, f.from), b = Math.min(e.to, f.to);
      // An en-suite opens from its bedroom.
      const ensuite = self.name === 'Master bath' && o.name === 'Master bedroom';
      const score = (ensuite ? 10 : RANK[o.name] ?? RANK[o.type] ?? 0) * 100 + (b - a);
      if (b - a > 0.7 && (!best || score > best.score)) best = { room: o, from: a, to: b, len: b - a, score };
    }
  }
  return best;
}
const r2 = (v) => Math.round(v * 100) / 100;
function doorOn(kind, e, from, size) {
  if (e.o === 'h') return { kind, x: r2(from), y: r2(e.rot === 0 ? e.at : e.at - size), w: size, h: size, r: e.rot, m: 0 };
  return { kind, x: r2(e.rot === 270 ? e.at : e.at - size), y: r2(from), w: size, h: size, r: e.rot, m: 0 };
}
function windowOn(e) {
  const len = r2(Math.min(1.8, (e.to - e.from) * 0.5));
  const mid = (e.from + e.to) / 2;
  return e.o === 'h'
    ? { kind: 'window', x: r2(mid - len / 2), y: r2(e.at - 0.075), w: len, h: 0.15 }
    : { kind: 'window', x: r2(e.at - 0.075), y: r2(mid - len / 2), w: 0.15, h: len };
}
function withOpenings(layout) {
  const out = [];
  for (const room of layout.rooms) {
    const es = edges(room).map((e) => ({ ...e, share: shared(e, layout.rooms, room) }));
    const outside = es.filter((e) => !e.share).sort((a, b) => (b.to - b.from) - (a.to - a.from));
    if (['living', 'bedroom', 'kitchen'].includes(room.type) && outside[0]) out.push(windowOn(outside[0]));
    if (room.type === 'living') {
      const wall = outside[1] || outside[0];
      if (wall) out.push(doorOn('mainDoor', wall, wall.to - 1.3, 1.0));
      continue;
    }
    if (room.type === 'yard' || room.name === 'Corridor') continue;
    const inner = es.filter((e) => e.share).sort((a, b) => b.share.score - a.share.score)[0];
    if (!inner) continue;
    // Doors go at the far end of the shared wall, clear of the wardrobes the layouts place at the near end.
    const size = room.type === 'bathroom' ? 0.7 : 0.85;
    out.push(doorOn('door', inner, inner.share.to - size - 0.15, size));
  }
  return { ...layout, items: layout.items.concat(out) };
}

export const LAYOUTS = {
  hdb3: {
    label: '3-room HDB',
    rooms: [R('Living & dining', 'living', 0, 0, 6, 4), R('Kitchen', 'kitchen', 6, 0, 2.6, 3.2), R('Yard', 'yard', 6, 3.2, 2.6, 0.8),
      R('Master bedroom', 'bedroom', 0, 4, 3.3, 3.3), R('Master bath', 'bathroom', 0, 7.3, 1.8, 1.5), R('Bathroom', 'bathroom', 3.3, 4, 1.6, 1.8),
      R('Bedroom 2', 'bedroom', 4.9, 4, 3, 3), R('Shelter', 'other', 3.3, 5.8, 1.6, 1.3)],
    items: [I('tvConsole', 0.3, 0.05, 2.4, 0.4), I('sofa', 0.6, 2.4, 2.1, 0.9), I('dining', 4, 1.6, 1.4, 0.8), I('shoeCabinet', 4.7, 3.55, 1.2, 0.4),
      I('kitchenBase', 6.05, 0.05, 2.5, 0.6), I('kitchenTop', 6.05, 0.7, 2.5, 0.35), I('fridge', 7.85, 2.4, 0.7, 0.7),
      I('wardrobe', 0.05, 4.05, 2.4, 0.6), I('queenBed', 0.8, 5.1, 1.6, 2), I('wardrobe', 5, 4.05, 1.8, 0.6), I('singleBed', 6.8, 4.8, 1, 2)],
  },
  hdb4: {
    label: '4-room HDB',
    rooms: [R('Living & dining', 'living', 0, 0, 6.6, 4.4), R('Kitchen', 'kitchen', 6.6, 0, 3, 3.4), R('Yard', 'yard', 6.6, 3.4, 3, 1),
      R('Master bedroom', 'bedroom', 0, 4.4, 3.6, 3.4), R('Master bath', 'bathroom', 0, 7.8, 2, 1.6), R('Bathroom', 'bathroom', 3.6, 4.4, 1.6, 2),
      R('Bedroom 2', 'bedroom', 5.2, 4.4, 2.9, 3.2), R('Bedroom 3', 'bedroom', 8.1, 4.4, 2.9, 3.2), R('Shelter', 'other', 3.6, 6.4, 1.6, 1.4)],
    items: [I('tvConsole', 0.3, 0.05, 3, 0.4), I('sofa', 0.7, 2.7, 2.1, 0.9), I('dining', 4.3, 1.8, 1.4, 0.8), I('shoeCabinet', 5.05, 3.95, 1.5, 0.4),
      I('kitchenBase', 6.65, 0.05, 2.9, 0.6), I('kitchenTop', 6.65, 0.7, 2.9, 0.35), I('fridge', 8.85, 2.6, 0.7, 0.7), I('washer', 6.7, 3.45, 0.6, 0.6),
      I('wardrobe', 0.05, 4.45, 2.4, 0.6), I('queenBed', 1, 5.6, 1.6, 2), I('wardrobe', 5.25, 4.45, 1.8, 0.6), I('singleBed', 7, 5.4, 1, 2),
      I('wardrobe', 8.15, 4.45, 1.8, 0.6), I('studyTable', 8.15, 6.9, 1.2, 0.6)],
  },
  hdb5: {
    label: '5-room HDB',
    rooms: [R('Living & dining', 'living', 0, 0, 7.4, 4.6), R('Kitchen', 'kitchen', 7.4, 0, 3.2, 3.6), R('Yard', 'yard', 7.4, 3.6, 3.2, 1),
      R('Master bedroom', 'bedroom', 0, 4.6, 4, 3.6), R('Master bath', 'bathroom', 0, 8.2, 2.2, 1.6), R('Bathroom', 'bathroom', 4, 4.6, 1.7, 2),
      R('Bedroom 2', 'bedroom', 5.7, 4.6, 3, 3.3), R('Bedroom 3', 'bedroom', 8.7, 4.6, 3, 3.3), R('Study', 'other', 2.2, 8.2, 3, 2.4), R('Shelter', 'other', 4, 6.6, 1.7, 1.4)],
    items: [I('tvConsole', 0.4, 0.05, 3.6, 0.4), I('sofa', 0.9, 2.8, 2.4, 0.9), I('dining', 5, 1.9, 1.6, 0.9), I('shoeCabinet', 5.6, 4.15, 1.8, 0.4),
      I('kitchenBase', 7.45, 0.05, 3.1, 0.6), I('kitchenTop', 7.45, 0.7, 3.1, 0.35), I('fridge', 9.85, 2.8, 0.7, 0.7), I('washer', 7.5, 3.65, 0.6, 0.6),
      I('wardrobe', 0.05, 4.65, 2.7, 0.6), I('queenBed', 1.2, 5.9, 1.6, 2), I('wardrobe', 5.75, 4.65, 1.8, 0.6), I('singleBed', 7.6, 5.6, 1, 2),
      I('wardrobe', 8.75, 4.65, 1.8, 0.6), I('singleBed', 10.6, 5.6, 1, 2), I('studyTable', 2.3, 8.25, 1.8, 0.6)],
  },
  condo: {
    label: 'Condo (2-bedroom)',
    rooms: [R('Living & dining', 'living', 0, 0, 5.5, 4), R('Kitchen', 'kitchen', 5.5, 0, 2.4, 3), R('Balcony', 'yard', 0, -1.4, 3, 1.4),
      R('Master bedroom', 'bedroom', 0, 4, 3.2, 3.2), R('Master bath', 'bathroom', 3.2, 4, 1.6, 2), R('Bedroom 2', 'bedroom', 4.8, 4, 2.8, 2.8), R('Bathroom', 'bathroom', 5.5, 3, 2.4, 1)],
    items: [I('tvConsole', 0.3, 0.05, 2.4, 0.4), I('sofa', 0.6, 2.4, 2.1, 0.9), I('dining', 3.6, 1.6, 1.4, 0.8), I('shoeCabinet', 4.2, 3.55, 1.2, 0.4),
      I('kitchenTop', 5.55, 0.05, 2.3, 0.35), I('wardrobe', 0.05, 4.05, 2.4, 0.6), I('queenBed', 0.8, 5, 1.6, 2), I('wardrobe', 4.85, 4.05, 1.8, 0.6), I('singleBed', 6.5, 4.7, 1, 2)],
  },
  blank: { label: 'Blank plan', rooms: [], items: [] },
};
// HDB starter layouts get a 1 m corridor between the living area and the bedrooms, so doors have
// somewhere sensible to open onto.
function withCorridor(layout, splitY, width) {
  const shift = (o) => (o.y >= splitY - 0.001 ? { ...o, y: r2(o.y + 1) } : o);
  return { ...layout, rooms: [R('Corridor', 'other', 0, splitY, width, 1)].concat(layout.rooms.map(shift)), items: layout.items.map(shift) };
}
LAYOUTS.hdb3 = withCorridor(LAYOUTS.hdb3, 4, 7.9);
LAYOUTS.hdb4 = withCorridor(LAYOUTS.hdb4, 4.4, 11);
LAYOUTS.hdb5 = withCorridor(LAYOUTS.hdb5, 4.6, 11.7);
for (const k of Object.keys(LAYOUTS)) LAYOUTS[k] = withOpenings(LAYOUTS[k]);

export const SQFT_PER_M2 = 10.7639;
export const FT_PER_M = 3.28084;

// plan: { rooms: [{ type, w, h }], items: [{ kind, w, h }] }
// returns { totalM2, dryM2, drySqft, bathrooms, rooms, doors, windows, qty: { estimatorKey: number } }
export function planQuantities(plan, ROOM_TYPES, CATALOG) {
  var SQFT = 10.7639, FT = 3.28084;
  var totalM2 = 0, dryM2 = 0, bathrooms = 0, rooms = 0, doors = 0, windows = 0, runs = {}, qty = {};
  var num = function (v) { var x = Number(v); return isFinite(x) && x > 0 ? x : 0; };
  (plan.rooms || []).forEach(function (r) {
    var t = ROOM_TYPES[r.type]; if (!t) return;
    var a = num(r.w) * num(r.h); if (!a) return;
    rooms++; totalM2 += a;
    if (t.dry) dryM2 += a;
    if (r.type === 'bathroom') bathrooms++;
  });
  (plan.items || []).forEach(function (it) {
    var c = CATALOG[it.kind]; if (!c) return;
    if (c.opening === 'window') { windows++; return; }
    if (c.opening) { doors++; return; }
    if (!c.qty) return;
    if (c.measure === 'count') { qty[c.qty] = (qty[c.qty] || 0) + 1; return; }
    runs[c.qty] = (runs[c.qty] || 0) + Math.max(num(it.w), num(it.h)) * FT;
  });
  Object.keys(runs).forEach(function (k) { if (runs[k] > 0) qty[k] = Math.ceil(runs[k]); });
  var drySqft = Math.round(dryM2 * SQFT);
  if (drySqft > 0) qty.vinyl = drySqft;
  return { totalM2: Math.round(totalM2 * 10) / 10, dryM2: Math.round(dryM2 * 10) / 10, drySqft: drySqft, bathrooms: bathrooms, rooms: rooms, doors: doors, windows: windows, qty: qty };
}
