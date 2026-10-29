// content/timeline.js — maths for the renovation timeline planner (/tools/renovation-timeline-planner).
// Works back from the date you need the home. The lead times are the ones in our checklist and timeline guide
// (content/checklist.js): shortlist 3 to 6 months before works, sign 2 to 3 months before, permits and design 1 to 2
// months before, long-lead orders 4 to 8 weeks before, and site work of about 8 to 12 weeks. They are planning
// benchmarks, not promises: real schedules depend on the firm, the scope and approvals.
// `planTimeline` is self-contained so the same code runs on the server (tests) and in the browser.

export const ON_SITE_OPTIONS = [
  [8, 'Lighter scope (about 8 weeks on site)'],
  [10, 'Typical (about 10 weeks on site)'],
  [12, 'Larger or older home (about 12 weeks on site)'],
];

// input: { moveIn: 'YYYY-MM-DD', onSiteWeeks, bufferWeeks, today: 'YYYY-MM-DD', keyDate?: 'YYYY-MM-DD' }
export function planTimeline(input) {
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d.getTime()) || d.getUTCDate() !== +m[3] ? null : d;
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function addMonths(d, n) { var x = new Date(d.getTime()); x.setUTCMonth(x.getUTCMonth() + n); return x; }
  var moveIn = parse(input && input.moveIn), today = parse(input && input.today), key = parse(input && input.keyDate);
  if (!moveIn) return { ok: false, error: 'Enter the date you need the home.' };
  if (!today) return { ok: false, error: 'Today\'s date is missing.' };
  var W = Number(input.onSiteWeeks), B = Number(input.bufferWeeks);
  if (!(W >= 2 && W <= 40)) return { ok: false, error: 'Choose how long the works will take.' };
  if (!(B >= 0 && B <= 12)) B = 2;
  var start = addDays(moveIn, -7 * (W + B));
  var end = addDays(start, 7 * W);
  var ms = [
    { key: 'shortlist', label: 'Set your budget and brief, and shortlist designers', from: addMonths(start, -6), to: addMonths(start, -3), guide: '/guides/renovation-checklist-singapore' },
    { key: 'sign', label: 'Meet firms, compare quotes, check credentials and sign the contract', from: addMonths(start, -3), to: addMonths(start, -2), guide: '/tools/renovation-quote-comparison' },
    { key: 'permit', label: 'Permits and approvals, and final design', from: addMonths(start, -2), to: addMonths(start, -1), guide: '/guides/hdb-renovation-permit-and-rules' },
    { key: 'order', label: 'Order long-lead items (appliances, sanitary, lights, tiles, countertops)', from: addDays(start, -56), to: addDays(start, -28), guide: '/blog/bto-renovation-timeline-singapore' },
    { key: 'start', label: 'Works start on site', from: start, to: start, guide: '' },
    { key: 'end', label: 'Works finish. Handover inspection and defects list', from: end, to: end, guide: '/guides/renovation-checklist-singapore' },
    { key: 'movein', label: 'Cleaning, curtains and furniture delivery, then move in', from: end, to: moveIn, guide: '' },
    { key: 'dlp', label: 'Final defects inspection, a few weeks before your defects liability period ends (check your contract)', from: addMonths(end, 10), to: addMonths(end, 11), guide: '/blog/defects-liability-period-singapore' },
  ].map(function (m) {
    return { key: m.key, label: m.label, from: iso(m.from), to: iso(m.to), guide: m.guide, status: m.to < today ? 'past' : m.from <= today ? 'now' : 'upcoming' };
  });
  var warnings = [];
  // The latest the first step can start and still have the full lead time.
  var behind = ms.filter(function (m) { return m.key !== 'dlp' && m.status === 'past' && (m.key === 'shortlist' || m.key === 'sign' || m.key === 'permit' || m.key === 'order'); });
  if (iso(start) < iso(today)) warnings.push('The works would have to start before today. Move the date later.');
  else if (behind.length) warnings.push('You are inside the usual lead time for: ' + behind.map(function (m) { return m.label.split(',')[0].toLowerCase(); }).join('; ') + '. You can compress some steps, but that leaves less room for comparing quotes and ordering items.');
  if (key && iso(start) < iso(key)) warnings.push('Works would start before your key collection date (' + iso(key) + '). Works can only start after you collect the keys: move the move-in date later or shorten the works.');
  // Earliest realistic dates from today: tightest keeps only 2 months to sign, permit and order; comfortable keeps 4.
  var onSite = 7 * (W + B);
  return { ok: true, worksStart: iso(start), worksEnd: iso(end), milestones: ms, warnings: warnings,
    tightest: iso(addDays(addMonths(today, 2), onSite)), comfortable: iso(addDays(addMonths(today, 4), onSite)) };
}
