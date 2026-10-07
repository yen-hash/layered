// content/trades.js — business categories beyond interior design: renovation trades and the landed
// specialists (architects, engineers/QPs, landed builders). Each trade gets an indexable page at
// /services/<slug>; the landed specialists live in the premium /landed section.
//
// Regulatory statements are limited to well-established Singapore rules (EMA-licensed electrical
// workers, PUB-licensed plumbers, Board of Architects, Professional Engineers Board, BCA builder
// licensing). Keep them general and point readers to the official registers.

export const DEFAULT_CATEGORY = 'interior-design';

export const TRADES = [
  {
    slug: 'lighting', name: 'Lighting supplier', plural: 'Lighting shops and installers',
    title: 'Lighting Shops and Installers in Singapore',
    description: 'Find lighting shops and installers in Singapore for downlights, pendants, cove and track lighting. What to check before you buy and who should install it.',
    intro: 'Lighting is chosen late and noticed every day. Plan the fittings with your lighting points: the electrician wires the points, and the lighting supplier provides the downlights, pendants, track and cove lighting that go on them.',
    checks: ['Colour temperature (warm 3000K for living areas and bedrooms, cooler for kitchens and study areas) and whether it is consistent across fittings', 'Dimmable fittings need a compatible dimmer and driver', 'Warranty on LED fittings and drivers, and who replaces a failed one', 'Whether installation is included, and that any new wiring is done by a licensed electrical worker'],
    estimator: true,
    faqs: [{ q: 'Who installs light fittings?', a: 'Many lighting shops install what they sell. Any new wiring or new lighting points should be done by an electrical worker licensed by the Energy Market Authority (EMA).' }],
  },
  {
    slug: 'curtains-blinds', name: 'Curtains and blinds', plural: 'Curtain and blind specialists',
    title: 'Curtain and Blind Specialists in Singapore',
    description: 'Compare curtain and blind specialists in Singapore: day and night curtains, roller and zebra blinds, motorised tracks. What to check before you order.',
    intro: 'Curtains and blinds are usually measured once the windows and ceilings are done. Book a measurement after carpentry and false ceilings are in, so tracks and pelmets fit properly.',
    checks: ['Free measurement and installation, and whether the quote is per panel or per square foot', 'Track type and whether it is recessed into the ceiling or pelmet', 'Blackout or dim-out lining for bedrooms', 'Lead time for fabrics and motorised systems', 'Warranty on motors and tracks'],
    faqs: [{ q: 'When should I order curtains during a renovation?', a: 'After the false ceiling, cove lighting and window grilles are installed, so the measurements and track positions are final.' }],
  },
  {
    slug: 'furniture', name: 'Furniture store', plural: 'Furniture stores',
    title: 'Furniture Stores in Singapore',
    description: 'Find furniture stores in Singapore for sofas, dining sets, beds and storage. Plan sizes with our room planner and check delivery and lead times first.',
    intro: 'Loose furniture is usually outside the renovation contract. Measure your rooms first: our room planner lets you test a sofa or dining table at the right size before you buy.',
    checks: ['Delivery lead time, especially for made-to-order and imported pieces', 'Whether delivery includes assembly and disposal of old furniture', 'Lift and doorway sizes for large sofas and wardrobes', 'Warranty on frames, upholstery and mechanisms'],
    planner: true,
    faqs: [{ q: 'Should I buy furniture before or after renovating?', a: 'Choose the main pieces before carpentry is finalised so built-ins and loose furniture fit together, and schedule delivery after the post-renovation clean.' }],
  },
  {
    slug: 'movers', name: 'Mover', plural: 'Movers and moving companies',
    title: 'Movers in Singapore: Find a Moving Company',
    description: 'Find movers in Singapore for HDB and condo moves. What a moving quote should include, how to protect a newly renovated home and what to book in advance.',
    intro: 'A move into a newly renovated home needs protecting the new floors and walls as much as packing. Book movers once your handover date is firm.',
    checks: ['A written quote listing the number of crew, trucks and hours, and what counts as extra', 'Insurance or compensation terms for damaged items', 'Floor, door frame and lift protection for your new home', 'Your condo\'s move-in rules, lift booking and deposit, if any', 'Packing materials and disposal of unwanted furniture'],
    faqs: [{ q: 'How far ahead should I book movers?', a: 'Two to four weeks ahead is common, and earlier for month-end and weekend moves.' }],
  },
  {
    slug: 'aircon', name: 'Aircon installer', plural: 'Aircon installers',
    title: 'Aircon Installers in Singapore',
    description: 'Find aircon installers in Singapore for new systems and replacements. What an installation quote should include, from piping to trunking and the isolator point.',
    intro: 'Plan the aircon with your renovation, not after it. Piping, trunking and condenser positions affect false ceilings and carpentry, and new isolator points are electrical work.',
    checks: ['Brand, model and energy rating of each unit', 'What standard piping length is included and the price for extra', 'Trunking or concealed piping, and whether hacking is needed', 'Who installs the isolator point (a licensed electrical worker)', 'Installation warranty and the manufacturer\'s warranty'],
    estimator: true,
    faqs: [{ q: 'Should aircon piping be concealed?', a: 'Concealed piping looks neater but is harder to service and must be planned before false ceilings and carpentry. Ask your installer and designer to agree the route early.' }],
  },
  {
    slug: 'flooring', name: 'Flooring specialist', plural: 'Flooring specialists',
    title: 'Flooring Specialists in Singapore: Vinyl and Tiles',
    description: 'Compare flooring specialists in Singapore for vinyl, tiles, timber and overlays. What to check in a flooring quote and how it is priced per square foot.',
    intro: 'Flooring is priced per square foot, so measure first. Our cost estimator shows typical 2026 rates for vinyl, overlays and new tiles.',
    checks: ['Price per square foot and what it includes: skirting, underlay, levelling and edging', 'Whether the existing floor is overlaid or hacked first', 'Product thickness, wear layer and warranty', 'Lead time and how long rooms are out of use'],
    estimator: true,
    faqs: [{ q: 'Can vinyl be laid over existing tiles?', a: 'Often yes, if the tiles are flat and firmly bonded. Hollow or uneven tiles should be fixed first. Ask the installer to check before quoting.' }],
  },
  {
    slug: 'carpentry', name: 'Carpenter', plural: 'Carpenters and carpentry firms',
    title: 'Carpentry Firms in Singapore for Built-ins',
    description: 'Find carpentry firms in Singapore for wardrobes, kitchen cabinets, TV consoles and built-ins. How carpentry is priced per foot run and what to compare.',
    intro: 'Carpentry is often the largest part of a renovation budget and is usually priced per foot run. Draw your built-ins in the room planner to work out the foot runs before you ask for quotes.',
    checks: ['Price per foot run, and whether top and bottom kitchen cabinets are counted separately', 'Board material (plywood or particle board) and laminate brand', 'Hinge, drawer and runner brands and whether they are soft-close', 'Shop drawings for you to approve before fabrication', 'Warranty on carcass and hardware'],
    estimator: true, planner: true,
    faqs: [{ q: 'What is a foot run?', a: 'The length of a unit measured along the wall, in feet. A 6-foot-wide wardrobe is 6 foot run regardless of height.' }],
  },
  {
    slug: 'painting', name: 'Painter', plural: 'Painters and painting services',
    title: 'Painting Services in Singapore',
    description: 'Find painters in Singapore for whole-home and single-room painting. What a painting quote should include, from sealer coats to colour changes and touch-ups.',
    intro: 'A whole-home repaint is one of the most affordable ways to refresh a home. Ask what preparation is included, because that is where quotes differ.',
    checks: ['Paint brand and range, and the number of coats including a sealer', 'Preparation: filling cracks, sanding and treating stains or mould', 'Whether ceilings, doors and grilles are included', 'Furniture moving and floor protection', 'A touch-up visit after handover'],
    estimator: true,
    faqs: [{ q: 'How long does it take to paint an HDB flat?', a: 'A whole flat commonly takes two to four days, depending on size, preparation and colour changes.' }],
  },
  {
    slug: 'electrician', name: 'Electrician', plural: 'Electricians',
    title: 'Licensed Electricians in Singapore',
    description: 'Find electricians in Singapore for rewiring, new lighting and power points, and aircon isolators. Why the electrician must be EMA-licensed and what to ask.',
    intro: 'Electrical installation work in Singapore must be carried out by an electrical worker licensed by the Energy Market Authority (EMA). Ask for the licence details before work starts.',
    checks: ['EMA licence details for the electrical worker doing the job', 'A point-by-point quote for lights, power points and isolators', 'Whether rewiring includes a new distribution board', 'Testing and a certificate on completion where required', 'Warranty on workmanship'],
    estimator: true,
    faqs: [{ q: 'Do I need a licensed electrician for new power points?', a: 'Yes. Electrical installation work, including new points and rewiring, should be done by an EMA-licensed electrical worker.' }],
  },
  {
    slug: 'plumber', name: 'Plumber', plural: 'Plumbers',
    title: 'Licensed Plumbers in Singapore',
    description: 'Find plumbers in Singapore for kitchen and bathroom works, water heaters and leaks. Why water service work needs a PUB-licensed plumber and what to ask.',
    intro: 'Work on water service installations in Singapore is carried out by plumbers licensed by PUB, Singapore\'s national water agency. Check the licence before work starts.',
    checks: ['PUB licence details for the plumber', 'Exact scope: pipe replacement, new points, sanitary fittings, water heater', 'Pipe material and whether old pipes are replaced or tied in', 'Leak testing before tiling and carpentry close everything up', 'Warranty on workmanship'],
    estimator: true,
    faqs: [{ q: 'Should pipes be replaced in a resale flat?', a: 'If the bathroom or kitchen is being hacked anyway, replacing old pipes at the same time is usually cheaper than doing it later. Ask a licensed plumber to inspect.' }],
  },
  {
    slug: 'smart-home', name: 'Smart home and digital locks', plural: 'Smart home and digital lock specialists',
    title: 'Smart Home and Digital Locks in Singapore',
    description: 'Find smart home and digital lock specialists in Singapore. What to check for locks, smart switches, lighting control and Wi-Fi before your renovation is done.',
    intro: 'Smart switches, sensors and Wi-Fi access points need wiring and positions decided before carpentry and ceilings close up. Digital locks can be fitted at any time but must suit your door.',
    checks: ['That the digital lock suits your door type and thickness, including any fire-rated main door', 'Which app or hub controls the devices, and whether it needs a subscription', 'Neutral wires and back-box sizes for smart switches', 'Wi-Fi coverage and where access points go', 'Warranty and local servicing'],
    faqs: [{ q: 'When should I plan smart home wiring?', a: 'Before electrical works start, so wiring, switch boxes and access points are in place before ceilings and carpentry are closed.' }],
  },
  {
    slug: 'cleaning', name: 'Post-renovation cleaning', plural: 'Post-renovation cleaning services',
    title: 'Post-Renovation Cleaning Services in Singapore',
    description: 'Find post-renovation cleaning services in Singapore. What a post-renovation clean should cover, from dust in carpentry to cement stains, and when to book it.',
    intro: 'A post-renovation clean is a deep clean of dust, cement and paint residue that a normal clean will not shift. Book it after all trades have finished and before furniture arrives.',
    checks: ['A checklist of what is included: inside carpentry, windows and tracks, grout, fittings', 'Team size and number of hours', 'Cement and paint stain removal and what equipment is used', 'A re-clean policy if areas are missed'],
    faqs: [{ q: 'When should post-renovation cleaning be done?', a: 'After every trade has finished, including curtains and lighting, and before furniture delivery.' }],
  },
];

export const TRADE_BY_SLUG = Object.fromEntries(TRADES.map((t) => [t.slug, t]));

export const LANDED_PROS = [
  { slug: 'architect', name: 'Architect', plural: 'Architects', blurb: 'Designs the house, prepares planning and building plan submissions, and is often the Qualified Person (QP). Architects must be registered with the Board of Architects.' },
  { slug: 'qp-engineer', name: 'Structural engineer (QP)', plural: 'Structural engineers and QPs', blurb: 'Designs and endorses the structure, foundations and any changes to columns, beams and slabs. Professional Engineers must be registered with the Professional Engineers Board.' },
  { slug: 'landed-builder', name: 'Landed builder', plural: 'Landed builders (A&A and rebuild)', blurb: 'The main contractor who builds the works. Building works that need BCA approval are carried out by a builder licensed by BCA.' },
];

// Every category a business can belong to, for signup, profiles and lead routing.
export const CATEGORIES = [
  { slug: DEFAULT_CATEGORY, name: 'Interior designer', plural: 'Interior designers', group: 'Interior design', path: '/designers' },
  ...LANDED_PROS.map((p) => ({ slug: p.slug, name: p.name, plural: p.plural, group: 'Landed A&A and rebuild', path: '/landed' })),
  ...TRADES.map((t) => ({ slug: t.slug, name: t.name, plural: t.plural, group: 'Renovation trades', path: `/services/${t.slug}` })),
];
export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const validCategory = (s) => (CATEGORY_BY_SLUG[s] ? s : DEFAULT_CATEGORY);

// Landed costs, collected from Singapore architects', builders' and cost guides published in 2026.
// Construction rates are per square foot of gross floor area; fees are percentages of construction cost.
export const LANDED_REVIEWED = '2026-10-07';
export const LANDED_COSTS = {
  rebuild: {
    terrace: { label: 'Terrace (intermediate or corner)', mid: [280, 330], premium: [380, 500] },
    semid: { label: 'Semi-detached', mid: [300, 380], premium: [420, 600] },
    detached: { label: 'Detached / bungalow', mid: [320, 420], premium: [500, 800] },
  },
  aa: { label: 'Addition and alteration (A&A)', psf: [180, 300] },
  architectFee: [0.05, 0.12],
  engineerFee: [0.02, 0.05],
  demolition: [15000, 50000],
  submissions: 10000,
};
export const LANDED_SOURCES = [
  ['Rebuild construction rates by house type', 'https://leeandco.sg/insights/singapore-landed-construction-cost-2026/'],
  ['A&A construction rates and QP involvement', 'https://vincentlim.sg/addition-and-alteration-aa-cost-singapore-the-2026-strategic-guide-for-landed-property-owners/'],
  ['Approval stages and timings (URA and BCA)', 'https://leeandco.sg/insights/bca-ura-approval-timeline-landed-2026/'],
  ['Rebuild timeline and demolition costs', 'https://www.hitomoconstruction.com/post/budgeting-rebuild-cost-breakdown-landed-home-singapore'],
  ['Architectural fees for landed homes', 'https://joyaarchitects.com/blogs/architectural-fees-landed/'],
];

// input: { scope: 'rebuild'|'aa', type: key of rebuild, spec: 'mid'|'premium', gfa: sqft }
// returns { ok, build:[lo,hi], fees:[lo,hi], extras:[lo,hi], total:[lo,hi] } or { ok:false, error }
export function landedEstimate(input, C) {
  var gfa = Number(input.gfa);
  if (!(gfa >= 500 && gfa <= 30000)) return { ok: false, error: 'Enter a gross floor area between 500 and 30,000 square feet.' };
  var rate;
  if (input.scope === 'aa') rate = C.aa.psf;
  else {
    var t = C.rebuild[input.type];
    if (!t || (input.spec !== 'mid' && input.spec !== 'premium')) return { ok: false, error: 'Choose a house type and specification.' };
    rate = t[input.spec];
  }
  var build = [rate[0] * gfa, rate[1] * gfa];
  var fees = [build[0] * (C.architectFee[0] + C.engineerFee[0]), build[1] * (C.architectFee[1] + C.engineerFee[1])];
  var extras = input.scope === 'aa' ? [C.submissions * 0.5, C.submissions] : [C.demolition[0] + C.submissions, C.demolition[1] + C.submissions];
  return { ok: true, build: build, fees: fees, extras: extras, total: [build[0] + fees[0] + extras[0], build[1] + fees[1] + extras[1]] };
}
