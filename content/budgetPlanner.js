// content/budgetPlanner.js — rows and maths for the online renovation budget planner.
// Mirrors the downloadable Excel planner. No prices live here: the homeowner types in their own figures.
// `budgetSummary` is self-contained so the same code runs on the server (tests) and in the browser.

export const BUDGET_CATEGORIES = [
  ['hack', 'Hacking and disposal'],
  ['carpentry', 'Carpentry and built-ins (wardrobes, cabinets)'],
  ['floor', 'Flooring and tiling'],
  ['kitchen', 'Kitchen (wet works, counters, fittings)'],
  ['bath', 'Bathrooms (wet works, fittings, screens)'],
  ['elec', 'Electrical and rewiring'],
  ['plumb', 'Plumbing'],
  ['ceiling', 'False ceiling and lighting'],
  ['paint', 'Painting'],
  ['doors', 'Doors, gates and windows'],
  ['aircon', 'Aircon installation'],
  ['design', 'Design, project management and permits'],
  ['other', 'Other renovation works'],
];

export const OUTSIDE_ITEMS = [
  ['furniture', 'Furniture (sofa, dining table, beds)'],
  ['appliances', 'Appliances (fridge, washer, hob and hood if not in contract)'],
  ['curtains', 'Curtains and blinds'],
  ['lights', 'Lighting fittings bought separately'],
  ['moving', 'Moving'],
  ['cleaning', 'Post-renovation cleaning'],
  ['insurance', 'Renovation insurance (if not in contract)'],
  ['otherOut', 'Other'],
];

export const BUDGET_GST = 0.09;

// input: { ceiling, bufferPct, gstPct, gstIncluded, rows: {key: {planned, a, b, c, chosen, actual}}, outside: {key: {planned, actual}} }
export function budgetSummary(input) {
  function n(v) { var x = Number(v); return isFinite(x) && x > 0 ? x : 0; }
  var rows = (input && input.rows) || {}, outside = (input && input.outside) || {};
  var t = { planned: 0, a: 0, b: 0, c: 0, chosen: 0, actual: 0 }, k, f;
  for (k in rows) for (f in t) t[f] += n(rows[k] && rows[k][f]);
  var buffer = Math.min(Math.max(Number(input.bufferPct) || 0, 0), 100) / 100;
  var gst = Math.min(Math.max(Number(input.gstPct) || 0, 0), 100) / 100;
  var withBuffer = t.planned * (1 + buffer);
  var gstAmt = input.gstIncluded ? 0 : withBuffer * gst;
  var plannedAll = withBuffer + gstAmt;
  var chosenGst = input.gstIncluded ? t.chosen : t.chosen * (1 + gst);
  var out = { planned: 0, actual: 0 };
  for (k in outside) { out.planned += n(outside[k] && outside[k].planned); out.actual += n(outside[k] && outside[k].actual); }
  var ceiling = n(input.ceiling);
  var everything = plannedAll + out.planned;
  return {
    totals: t, withBuffer: withBuffer, gstAmt: gstAmt, plannedAll: plannedAll, chosenWithGst: chosenGst,
    outside: out, everything: everything, ceiling: ceiling,
    over: ceiling ? Math.round(everything - ceiling) : null,
    chosenOver: t.chosen && t.planned ? Math.round(t.chosen - t.planned) : null,
  };
}
