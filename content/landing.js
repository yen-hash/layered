// content/landing.js — copy for the "interior designers by property type / style" landing pages.
// Each page has its own text and FAQs so these are real landing pages, not the same
// directory listing under different URLs.

export const PROPERTY_PAGES = {
  hdb: {
    propertyType: 'HDB',
    title: 'HDB Interior Designers in Singapore',
    h1: 'HDB interior designers in Singapore',
    description: 'Compare HDB interior designers and renovation firms in Singapore for BTO and resale flats. See portfolios, HDB licence and CaseTrust badges, and get matched.',
    intro: `<p>An HDB flat is the most common home to renovate in Singapore, and the best HDB interior designers know how to make a compact space feel bigger: built-in storage that fits awkward corners, layouts that open up the living and dining areas, and finishes that suit a flat's natural light. They also know the HDB renovation process, including permits and approved working hours.</p>
<p>Use this page to compare HDB interior design firms and renovation contractors on Layered, then tell us about your BTO or resale flat and we will match you with firms that take on projects like yours.</p>`,
    costTitle: 'What does an HDB renovation cost?',
    cost: `<p>In 2026, standard-specification renovations are typically quoted around <strong>$40,000–$55,000 for a 4-room BTO</strong> and <strong>$55,000–$75,000 for a 4-room resale</strong>, with 5-room flats higher. Resale flats cost more because of extra hacking, rewiring and fixture replacement. See the full breakdown in our <a href="/guides/hdb-renovation-cost-singapore">HDB renovation cost guide</a>.</p>`,
    lookFor: [
      'An <strong>HDB-registered renovation contractor</strong>, because only registered contractors can apply for HDB renovation permits.',
      'Portfolios of flats the same size as yours, so the storage and layout ideas are proven in your floor plan.',
      'A clear plan for permits and working-hour rules. Read our <a href="/guides/hdb-renovation-permit-and-rules">HDB renovation permit and rules guide</a>.',
      '<strong>CaseTrust accreditation</strong> for a standard contract and deposit protection.',
      'An itemised quote with materials specified.',
    ],
    faqs: [
      { q: 'How do I find a good HDB interior designer in Singapore?', a: 'Shortlist firms with portfolios of HDB flats like yours, check that they are HDB-registered and ideally CaseTrust-accredited, then compare at least three itemised quotes before signing a contract.' },
      { q: 'How much does an HDB renovation cost?', a: 'Standard-specification 4-room renovations are typically quoted around $40,000 to $55,000 for a BTO and $55,000 to $75,000 for a resale flat in 2026. Costs rise with custom carpentry, hacking and premium finishes.' },
      { q: 'Do I need a renovation permit for my HDB flat?', a: 'Works such as hacking walls generally need an HDB renovation permit, which your HDB-registered contractor applies for on your behalf.' },
      { q: 'BTO or resale: which is cheaper to renovate?', a: 'BTO flats are usually cheaper to renovate because the finishes and services are new. Resale flats often need extra hacking, rewiring and replacement work, which can add 20% to 40%.' },
    ],
    related: ['hdb-renovation-cost-singapore', 'hdb-renovation-permit-and-rules'],
  },

  condo: {
    propertyType: 'Condo',
    title: 'Condo Interior Designers in Singapore',
    h1: 'Condo interior designers in Singapore',
    description: 'Find condo interior designers and renovation firms in Singapore. Compare portfolios for new launch and resale condos, and get matched with firms for your unit.',
    intro: `<p>Condo renovations are shaped by the unit's size and finish level and by the development's own rules. A designer who has already worked in your condo or one like it will know the management corporation's approval process, the deposit, the work-hour limits and how to protect the common areas, which keeps the project on schedule.</p>
<p>Browse condo interior designers on Layered, then share your unit details and we will connect you with firms that handle condo projects like yours, from a new launch fit-out to a full resale renovation.</p>`,
    costTitle: 'What does a condo renovation cost?',
    cost: `<p>Many Singapore guides quote roughly <strong>$50–$120 per square foot</strong> for a full condo renovation, with resale 2- to 4-bedroom units commonly reported between about $48,000 and $92,000 for standard scopes. See our <a href="/guides/condo-renovation-cost-and-rules">condo renovation cost and rules guide</a> for what drives the price.</p>`,
    lookFor: [
      'Experience with <strong>management corporation (MCST) approvals</strong> and deposits, ideally in your development.',
      'A portfolio of condos of a similar size, from compact apartments to larger family units.',
      'A scope that clearly states who handles approvals, protection of common areas and project management.',
      'Care with wet-area waterproofing, electrical loads and any changes that need professional sign-off.',
      '<strong>CaseTrust accreditation</strong> and a written contract with staged payments.',
    ],
    faqs: [
      { q: 'How do I choose a condo interior designer in Singapore?', a: 'Look for portfolios of condos similar to yours, ask whether they have worked in your development, confirm they handle management corporation approvals, and compare itemised quotes from at least three firms.' },
      { q: 'How much does it cost to renovate a condo in Singapore?', a: 'Many guides quote around $50 to $120 per square foot for a full renovation, with high-specification homes costing more. Total cost depends on the unit size, condition and amount of custom carpentry.' },
      { q: 'Do I need approval before renovating a condo?', a: 'Yes. Most condos require written approval from the management office or MCST, a refundable renovation deposit and compliance with their working hours and rules.' },
    ],
    related: ['condo-renovation-cost-and-rules', 'how-to-choose-an-interior-designer-singapore'],
  },

  landed: {
    propertyType: 'Landed',
    title: 'Landed Home Interior Designers in Singapore',
    h1: 'Landed home interior designers in Singapore',
    description: 'Compare interior designers and renovation firms for landed homes in Singapore: terrace, semi-detached and bungalow projects, from interiors to additions.',
    intro: `<p>Renovating a landed home in Singapore, whether a terrace, semi-detached house or bungalow, is closer to a small construction project than a flat refresh. Larger floor plans, multiple levels, outdoor spaces and sometimes structural changes mean you want a firm that can manage design, trades and approvals across a longer timeline.</p>
<p>Browse landed home interior designers on Layered. Share your property details and we will match you with firms that handle landed projects, including those that coordinate with architects for larger works.</p>`,
    costTitle: 'Budgeting for a landed home renovation',
    cost: `<p>Landed renovations vary far more than flats because the scope can range from a repaint and new joinery to a full addition and alteration. Costs scale with floor area and with any structural work, so get itemised quotes against a clearly defined scope rather than comparing headline numbers.</p>`,
    lookFor: [
      'Experience with <strong>multi-storey layouts</strong>, staircases, outdoor and car-porch areas.',
      'For extensions or structural changes, a plan for the required professional involvement and <strong>regulatory approvals</strong>, which your firm should explain upfront.',
      'Strong project management for a longer build, with a clear schedule and staged payments.',
      'Waterproofing, ventilation and lighting strategy suited to larger, taller spaces.',
      '<strong>CaseTrust accreditation</strong> and a detailed written contract.',
    ],
    faqs: [
      { q: 'What should I look for in a landed property interior designer?', a: 'Choose a firm with landed portfolios, strong project management for longer builds and a clear approach to approvals if your plans include structural changes or extensions.' },
      { q: 'Do landed home renovations need approvals?', a: 'Interior works often do not, but extensions, additions and structural changes typically need professional involvement and regulatory approvals. Ask your designer to explain exactly which apply to your plans.' },
      { q: 'How long does a landed home renovation take?', a: 'It depends heavily on scope. A cosmetic refresh can take weeks, while a major addition and alteration project can take many months, so agree a schedule in writing.' },
    ],
    related: ['how-to-choose-an-interior-designer-singapore', 'casetrust-and-hdb-licence-explained'],
  },

  commercial: {
    propertyType: 'Commercial',
    title: 'Commercial Interior Designers in Singapore',
    h1: 'Commercial interior designers in Singapore',
    description: 'Find commercial interior designers and fit-out contractors in Singapore for offices, retail and F&B. Compare portfolios and get matched.',
    intro: `<p>A commercial fit-out has to look good and work hard: it needs to reflect your brand, support the way your team or customers use the space and open on time. Commercial interior designers in Singapore handle offices, retail shops and food and beverage outlets, working within landlord requirements and any regulatory approvals your space needs.</p>
<p>Browse commercial interior design firms on Layered, then tell us about your space and timeline to get matched with firms that have delivered similar fit-outs.</p>`,
    costTitle: 'Budgeting for a commercial fit-out',
    cost: `<p>Commercial costs depend on the type of space (office, retail, F&amp;B), its size, the level of mechanical and electrical work, and the finish level. Agree a clear scope and ask each firm to itemise design, build, furniture and approvals so quotes can be compared fairly.</p>`,
    lookFor: [
      'A portfolio in <strong>your sector</strong>: office, retail or F&amp;B each have different technical needs.',
      'Familiarity with <strong>landlord fit-out guidelines</strong> and any approvals your layout may need, such as fire-safety requirements. Ask the firm to confirm which apply.',
      'A realistic timeline tied to your opening or move-in date, with milestones.',
      'Clear responsibility for mechanical, electrical and plumbing works and for after-completion defects.',
      'A written contract with staged payments.',
    ],
    faqs: [
      { q: 'What does a commercial interior designer do?', a: 'They design and often manage the fit-out of offices, shops and restaurants, covering layout, branding, materials, lighting, and coordinating the build within landlord and regulatory requirements.' },
      { q: 'How do I choose a commercial fit-out contractor?', a: 'Look for experience in your sector, ask for references from similar projects, compare itemised quotes and confirm who handles approvals and mechanical, electrical and plumbing works.' },
      { q: 'Do commercial fit-outs need approvals?', a: 'Often yes. Landlords have fit-out guidelines and some layouts or uses need regulatory approvals. Ask your firm to list which apply to your space before you commit.' },
    ],
    related: ['how-to-choose-an-interior-designer-singapore'],
  },
};

export const STYLE_PAGES = {
  minimalist: {
    tagline: 'calm neutrals, clean lines and hidden storage',
    style: 'Minimalist',
    blurb: 'Clean lines, calm neutral palettes and uncluttered rooms. Minimalist interiors suit smaller Singapore homes because hidden storage and a restrained palette make a space feel larger, with the focus on a few well-chosen materials such as light timber, white and soft greys.',
    traits: ['Neutral, low-contrast colour palette', 'Concealed, built-in storage to keep surfaces clear', 'Simple joinery with handleless or flush finishes', 'Natural light and uncluttered layouts'],
  },
  scandinavian: {
    tagline: 'light wood, white walls and cosy textures',
    style: 'Scandinavian',
    blurb: 'Light, warm and practical. Scandinavian interiors pair white or pale walls with light wood tones, soft textiles and plants. The look works well in HDB and condo homes because it brightens a space and keeps things functional and cosy.',
    traits: ['White and pale walls with light timber or timber-look finishes', 'Soft textiles and plants for warmth', 'Functional, uncluttered furniture', 'Bright, airy layouts that maximise daylight'],
  },
  industrial: {
    tagline: 'concrete finishes, black metal and open layouts',
    style: 'Industrial',
    blurb: 'Raw, characterful and bold. Industrial interiors borrow from lofts and factories with exposed finishes, dark metals, concrete-look surfaces and statement lighting. It suits open-plan spaces, higher ceilings, landed homes and commercial fit-outs such as cafes and studios.',
    traits: ['Concrete-look and exposed-brick-style surfaces', 'Black metal accents and open shelving', 'Statement lighting and darker palettes', 'Open layouts with visible structure and services'],
  },
  modern: {
    tagline: 'sleek joinery and a polished, efficient look',
    style: 'Modern',
    blurb: 'Sleek, current and functional. Modern interiors favour clean geometry, smooth finishes, integrated appliances and a restrained mix of materials. It is a flexible choice for condo and HDB homes that want a polished look without strong period character.',
    traits: ['Smooth, flat-panel joinery and integrated appliances', 'Clean geometry and a restrained palette', 'Statement lighting and a few feature materials', 'Smart and efficient use of space'],
  },
  contemporary: {
    tagline: 'warm neutrals, layered lighting and mixed textures',
    style: 'Contemporary',
    blurb: 'Of-the-moment and flexible. Contemporary design reflects current trends, mixing textures, curves, warm neutrals and layered lighting. Because it evolves, it gives designers room to tailor a home to your taste while keeping it fresh.',
    traits: ['Warm neutrals with textural contrast', 'Soft curves and layered lighting', 'A mix of materials such as timber, stone and metal', 'Adaptable layouts that reflect current trends'],
  },
  classic: {
    tagline: 'panelling, symmetry and timeless detailing',
    style: 'Classic',
    blurb: 'Timeless and refined. Classic interiors use symmetry, richer colours, moulding, panelling and traditional details to create an elegant, formal feel. It is popular in larger condos and landed homes where there is room for generous proportions and detailing.',
    traits: ['Symmetry and traditional proportions', 'Wall panelling, mouldings and detailed joinery', 'Richer colours and quality fabrics', 'Elegant, formal furniture and lighting'],
  },
};
