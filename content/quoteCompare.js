// content/quoteCompare.js — maths for the online quote comparison tool (/tools/renovation-quote-comparison).
// No prices live here: the homeowner types in the quotes they received. `compareQuotes` is self-contained so the same
// code runs on the server (tests) and in the browser (serialised with Function.prototype.toString).
import { BUDGET_CATEGORIES } from './budgetPlanner.js';

export const QUOTE_CATEGORIES = BUDGET_CATEGORIES;

// Things worth confirming on every quote (from the contract checklist). Each is a yes/no tick per firm.
export const QUOTE_CHECKS = [
  ['itemised', 'Itemised, with quantities and materials'],
  ['gst', 'GST treatment is stated (included or added)'],
  ['permit', 'Permits and approvals are named and handled'],
  ['design', 'Design and project management fee is stated'],
  ['points', 'Number of electrical points is stated'],
  ['exclusions', 'Exclusions are listed'],
  ['payment', 'Payment schedule is by stage, in writing'],
  ['warranty', 'Warranty and how to claim is in writing'],
  ['timeline', 'Start and completion dates, and a delay clause'],
  ['licence', 'HDB licence / CaseTrust checked on the official lookups'],
];

// input: { gstPct, firms: [{ name, gstIncluded, stated, lines: { key: amount }, checks: { key: bool } }] }
export function compareQuotes(input) {
  function n(v) { var x = Number(v); return isFinite(x) && x > 0 ? x : 0; }
  var gst = Math.min(Math.max(Number(input && input.gstPct) || 0, 0), 100) / 100;
  var firms = (input && input.firms) || [];
  var keys = {}, out = [], i, k;
  firms.forEach(function (f) { for (k in (f.lines || {})) keys[k] = true; });
  var per = firms.map(function (f) {
    var sum = 0, lines = f.lines || {};
    for (k in lines) sum += n(lines[k]);
    var exGst = f.gstIncluded ? sum / (1 + gst) : sum;
    var inclGst = f.gstIncluded ? sum : sum * (1 + gst);
    var checks = 0, c = f.checks || {};
    for (k in c) if (c[k]) checks += 1;
    var stated = n(f.stated);
    return { name: f.name || '', sum: sum, exGst: exGst, inclGst: inclGst, checks: checks, stated: stated,
      statedMismatch: stated > 0 && sum > 0 && Math.abs(stated - sum) > 1, missing: [] };
  });
  var rows = [];
  for (k in keys) {
    var amounts = firms.map(function (f) { return n((f.lines || {})[k]); });
    var quoted = amounts.filter(function (a) { return a > 0; });
    var row = { key: k, amounts: amounts, low: 0, high: 0, spread: null };
    if (quoted.length >= 1) {
      row.low = Math.min.apply(null, quoted); row.high = Math.max.apply(null, quoted);
      if (quoted.length >= 2) row.spread = row.high / row.low;
      amounts.forEach(function (a, idx) { if (a === 0 && per[idx].sum > 0) per[idx].missing.push(k); });
    }
    rows.push(row);
  }
  var priced = per.filter(function (p) { return p.sum > 0; });
  var cheapest = -1, lowest = Infinity;
  per.forEach(function (p, idx) { if (p.sum > 0 && p.inclGst < lowest) { lowest = p.inclGst; cheapest = idx; } });
  per.forEach(function (p) { p.vsLowest = p.sum > 0 && lowest < Infinity ? Math.round(p.inclGst - lowest) : null; });
  return { firms: per, rows: rows, cheapest: cheapest, comparable: priced.length >= 2 };
}
