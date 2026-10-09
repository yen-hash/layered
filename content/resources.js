// content/resources.js — the downloads on /resources and the questions for the design style quiz.
// The files in public/downloads are built by scripts/dev/ (see README there); they are committed so the
// production server (no Chromium or Python needed) only serves static files.

export const RESOURCES_REVIEWED = '2026-10-09';

export const RESOURCES = [
  {
    id: 'budget',
    title: 'Renovation budget planner (Excel)',
    summary: 'A spreadsheet to split your budget by category, record quotes from up to three firms side by side, add a buffer and GST, and track what you actually spend. Works in Excel, Numbers and Google Sheets.',
    file: '/downloads/layered-renovation-budget-planner.xlsx',
    label: 'Download the Excel planner',
    type: 'XLSX',
    also: [['/tools/renovation-cost-calculator', 'Cost calculator'], ['/tools/renovation-cost-estimator', 'Itemised estimator']],
  },
  {
    id: 'checklist',
    title: 'Homeowner renovation checklist (PDF)',
    summary: 'Every step from budget to handover and the defects period, as a printable tick-sheet. The same list as our online checklist, in a form you can keep on the fridge or bring to site visits.',
    file: '/downloads/layered-renovation-checklist.pdf',
    label: 'Download the checklist PDF',
    type: 'PDF',
    also: [['/guides/renovation-checklist-singapore', 'Tick it off online']],
  },
  {
    id: 'contract',
    title: 'Renovation contract checklist and sample clauses (PDF)',
    summary: 'What a renovation contract should say, in plain language, with fill-in-the-blank sample clauses to compare against the contract you are offered. It is a checklist, not the CaseTrust standard contract and not legal advice.',
    file: '/downloads/layered-renovation-contract-checklist.pdf',
    label: 'Download the contract checklist PDF',
    type: 'PDF',
    also: [['/guides/casetrust-and-hdb-licence-explained', 'CaseTrust & HDB licence explained'], ['/blog/renovation-contract-singapore-what-to-check', 'What to check in a renovation contract']],
  },
  {
    id: 'quiz',
    title: 'Design style quiz',
    summary: 'Seven quick questions to find which of six popular Singapore home styles suits you, then see designers who work in it. No sign-up.',
    href: '/tools/design-style-quiz',
    label: 'Take the quiz',
    type: 'Online',
    also: [],
  },
];

// Each option adds points to one or more styles (keys match STYLE_PAGES in content/landing.js).
export const QUIZ = [
  { q: 'Which room would you most like to walk into?', options: [
    ['A bright white room with pale timber and a few plants', { scandinavian: 3, minimalist: 1 }],
    ['A loft-style space with concrete tones and black metal', { industrial: 3 }],
    ['A calm, uncluttered room where nothing is out of place', { minimalist: 3, modern: 1 }],
    ['A warm hotel-lobby feel with soft curves and layered light', { contemporary: 3, modern: 1 }],
    ['A formal room with panelling, symmetry and rich wood', { classic: 3 }],
    ['A sleek, polished room with clean lines and a statement light', { modern: 3 }],
  ] },
  { q: 'Which colour palette feels most like home?', options: [
    ['White walls with pale wood', { scandinavian: 3, minimalist: 1 }],
    ['Greys, charcoal and black', { industrial: 3, modern: 1 }],
    ['Soft beige, taupe and earthy tones', { contemporary: 3, minimalist: 1 }],
    ['One quiet colour family, low contrast', { minimalist: 3 }],
    ['Deep colours, dark wood and touches of gold', { classic: 3 }],
    ['Crisp black, white and timber', { modern: 3, scandinavian: 1 }],
  ] },
  { q: 'How do you like to handle storage?', options: [
    ['Hide everything behind flush, handleless doors', { minimalist: 3, modern: 1 }],
    ['Open shelves with a few things on display', { industrial: 2, scandinavian: 2 }],
    ['Sleek, integrated cabinets with a few feature panels', { modern: 3 }],
    ['A mix of closed storage and display niches', { contemporary: 3 }],
    ['Furniture-style cabinets with detailing and handles', { classic: 3 }],
    ['Simple, practical storage in light finishes', { scandinavian: 3 }],
  ] },
  { q: 'What kind of lighting do you want?', options: [
    ['Bright, airy and full of daylight', { scandinavian: 3, minimalist: 1 }],
    ['A few statement pendants over the table and sofa', { modern: 2, industrial: 2 }],
    ['Warm, layered light from cove lights and downlights', { contemporary: 3 }],
    ['Simple and even, with no visible fixtures', { minimalist: 3 }],
    ['Chandeliers or wall lights with character', { classic: 3 }],
    ['Spotlights and exposed bulbs', { industrial: 3 }],
  ] },
  { q: 'Which materials do you reach for?', options: [
    ['Light timber, linen and cotton', { scandinavian: 3 }],
    ['Concrete-look surfaces and black metal', { industrial: 3 }],
    ['Smooth laminates, glass and integrated appliances', { modern: 3 }],
    ['A mix of timber, stone and metal', { contemporary: 3 }],
    ['Solid wood, marble and mouldings', { classic: 3 }],
    ['Plain painted surfaces and very little pattern', { minimalist: 3 }],
  ] },
  { q: 'Which furniture shapes appeal to you?', options: [
    ['Simple, straight lines', { minimalist: 3, modern: 1 }],
    ['Soft, rounded and comfortable', { contemporary: 3, scandinavian: 1 }],
    ['Sharp geometry and bold forms', { modern: 3 }],
    ['Raw, rugged and a bit worn-in', { industrial: 3 }],
    ['Traditional and ornate', { classic: 3 }],
    ['Light, cosy and practical', { scandinavian: 3 }],
  ] },
  { q: 'How do you feel about upkeep?', options: [
    ['I want as little to clean and style as possible', { minimalist: 3, modern: 1 }],
    ['I like things to look lived-in and do not mind wear', { industrial: 3, classic: 1 }],
    ['I enjoy styling and changing things with trends', { contemporary: 3 }],
    ['I like a timeless look that does not date', { classic: 3, scandinavian: 1 }],
    ['I want it bright, simple and easy to refresh', { scandinavian: 3 }],
    ['I want it polished and low-fuss', { modern: 3 }],
  ] },
];
