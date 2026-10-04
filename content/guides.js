// content/guides.js — long-form renovation guides targeting Singapore renovation / interior design searches.
//
// Cost figures are the typical ranges quoted by Singapore renovation guides in 2026. They are
// indicative only, so every page says so and tells readers to compare itemised quotes.
// Re-check numbers and rules whenever REVIEWED changes. HDB and each condo's management
// corporation set the actual rules, and the pages link to HDB rather than restating fine print.

export const REVIEWED = '2026-10-04';
export const REVIEWED_LABEL = 'October 2026';

export const GUIDES = [
  {
    slug: 'hdb-renovation-cost-singapore',
    title: 'HDB Renovation Cost in Singapore (2026 Guide)',
    h1: 'HDB renovation cost in Singapore: what to budget in 2026',
    description: 'How much does an HDB renovation cost in Singapore? Typical 2026 price ranges for 4-room and 5-room BTO and resale flats, what drives the price, and how to budget.',
    summary: 'Typical price ranges for BTO and resale flats, what moves the number, and how to compare quotes.',
    intro: `<p>Most HDB renovations in Singapore land somewhere between the high $30,000s and the $90,000s, but the range is wide for good reasons: flat type, whether it is a new BTO or a resale, and how much custom carpentry you want. This guide explains what is behind the numbers so you can set a realistic budget before you talk to designers.</p>`,
    sections: [
      {
        h2: 'Typical HDB renovation cost by flat type',
        html: `<p>The ranges below are what Singapore renovation guides were quoting in 2026 for a <strong>standard specification</strong> renovation. Treat them as a starting point, not a quote.</p>
<table class="data-table">
<thead><tr><th>Flat type</th><th>BTO (new)</th><th>Resale</th></tr></thead>
<tbody>
<tr><td>4-room</td><td>$40,000 – $55,000</td><td>$55,000 – $75,000</td></tr>
<tr><td>5-room</td><td>$45,000 – $67,000</td><td>$58,000 – $90,000</td></tr>
</tbody>
</table>
<p>For a 4-room flat, a basic specification is often quoted at roughly $30,000–$40,000 for a BTO and $40,000–$55,000 for a resale, while a premium specification can run from about $55,000 (BTO) to $75,000–$100,000 or more (resale).</p>`,
      },
      {
        h2: 'Why resale flats usually cost more than BTO',
        html: `<p>A BTO flat comes with fresh finishes and original wiring and plumbing, so most of the budget goes into carpentry, flooring and painting. A resale flat often needs extra work first: hacking out old tiles or walls, rewiring, replacing old pipes and fixtures, and waterproofing. Guides commonly put the resale premium at around 20–40%, or roughly $15,000–$27,000 for a 4-room flat.</p>
<p>If you are buying resale, ask the designer to inspect the flat <em>before</em> you finalise a budget, because hidden condition issues are the usual source of cost overruns.</p>`,
      },
      {
        h2: 'What drives the price up or down',
        html: `<ul>
<li><strong>Custom carpentry.</strong> Built-in wardrobes, feature walls, a full-height shoe cabinet and kitchen cabinets are usually the largest single line item. Fewer, simpler built-ins save the most money.</li>
<li><strong>Hacking and layout changes.</strong> Removing a non-structural wall or merging rooms adds demolition, rebuilding and permit work.</li>
<li><strong>Flooring and wet areas.</strong> Retiling bathrooms and the kitchen costs more than leaving good tiles alone.</li>
<li><strong>Electrical and plumbing.</strong> Rewiring, extra points and concealed piping add up quickly in an older flat.</li>
<li><strong>Materials and finishes.</strong> Laminate versus solid surfaces, tile grade and fittings can move the total by tens of thousands.</li>
<li><strong>Designer versus contractor.</strong> A design-and-build firm bundles design, project management and the build; a contractor-only route can cost less but leaves the design and coordination to you. See <a href="/guides/how-to-choose-an-interior-designer-singapore">how to choose an interior designer</a>.</li>
</ul>`,
      },
      {
        h2: 'How to budget and compare quotes',
        html: `<ol>
<li><strong>Set a ceiling first.</strong> Decide the most you are willing to spend, then ask designers what that budget realistically buys.</li>
<li><strong>Keep a buffer.</strong> A contingency of around 10–15% is commonly recommended for surprises, especially in resale flats.</li>
<li><strong>Get itemised quotes.</strong> Ask for at least three, broken down by work type, so you can compare like with like instead of one lump sum.</li>
<li><strong>Check the payment schedule.</strong> Payments should follow progress, not be front-loaded. See the section on deposits in our guide to <a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust and HDB licences</a>.</li>
<li><strong>Use an HDB-registered contractor.</strong> Works that need an HDB permit must be done by one. Read the <a href="/guides/hdb-renovation-permit-and-rules">HDB renovation permit and rules guide</a>.</li>
</ol>
<p>Ready to compare firms? Browse <a href="/interior-designers/hdb">HDB interior designers on Layered</a> or tell us about your flat and get matched.</p>`,
      },
    ],
    faqs: [
      { q: 'How much does it cost to renovate a 4-room BTO flat?', a: 'Guides in 2026 quote about $40,000 to $55,000 for a standard-specification 4-room BTO renovation, with basic specifications starting nearer $30,000 and premium specifications going above $55,000. Your actual cost depends on how much custom carpentry and flooring work you want.' },
      { q: 'Is renovating a resale HDB flat more expensive than a BTO?', a: 'Usually yes. Resale flats commonly need hacking, rewiring and fixture replacement, so a resale renovation is often quoted 20% to 40% higher than a comparable BTO.' },
      { q: 'How much should I set aside as a buffer?', a: 'A contingency of roughly 10% to 15% of the renovation budget is commonly recommended, and it matters most for older resale flats where hidden problems are more likely.' },
      { q: 'Do I need an HDB-registered contractor?', a: 'Works that need an HDB renovation permit must be carried out by a contractor registered with HDB, and the contractor applies for the permit on your behalf.' },
    ],
    related: ['hdb-renovation-permit-and-rules', 'how-to-choose-an-interior-designer-singapore', 'casetrust-and-hdb-licence-explained'],
    links: [['/interior-designers/hdb', 'HDB interior designers']],
  },

  {
    slug: 'hdb-renovation-permit-and-rules',
    title: 'HDB Renovation Permit & Rules in Singapore',
    h1: 'HDB renovation permit and rules: what Singapore flat owners need to know',
    description: 'Do you need an HDB renovation permit? Who applies, which walls cannot be hacked, work-hour limits and how to check your contractor is HDB-registered.',
    summary: 'Who applies for the permit, what you cannot hack, working-hour rules and how to check your contractor.',
    intro: `<p>Renovating an HDB flat is regulated, and the rules protect your neighbours and the building. Getting them wrong can mean stop-work orders, fines and paying to put things back. This guide covers the basics; HDB sets the detailed rules and updates them from time to time, so always confirm the current requirements with HDB before you start.</p>`,
    sections: [
      {
        h2: 'Do I need an HDB renovation permit?',
        html: `<p>Works that affect the flat's structure or services, such as hacking walls, generally need a renovation permit from HDB before they begin. Smaller cosmetic jobs like painting typically do not. Your designer or contractor should tell you which of your planned works need approval.</p>
<p><strong>The permit is applied for by the renovation contractor, not by you.</strong> Only contractors registered with HDB can apply, which is why checking your contractor's HDB registration comes first. Approval for straightforward applications usually takes a few working days, so build that into your timeline.</p>`,
      },
      {
        h2: 'What you cannot hack',
        html: `<p>Structural elements such as load-bearing walls, columns, beams and slabs cannot be removed. Many internal partition walls are non-structural and can be hacked with a permit, but you should never assume. Ask your contractor to confirm which walls in your specific flat are structural, using HDB's records, before the layout is designed around removing them.</p>`,
      },
      {
        h2: 'Working hours and noise',
        html: `<p>Renovation work is limited to set days and times. In general, noisy works such as hacking and drilling are allowed on weekdays during limited daytime hours, general renovation work has slightly wider hours, and no renovation is allowed on Sundays or public holidays. HDB has adjusted these hours over time, so check the latest schedule on <a href="https://www.hdb.gov.sg" rel="noopener noreferrer" target="_blank">HDB's website</a> and make sure your contractor's timeline respects it.</p>
<p>It is also good practice, and often expected, to let your neighbours know before noisy works start.</p>`,
      },
      {
        h2: 'What happens if the rules are broken',
        html: `<p>Hacking without a permit, removing a wall you were not allowed to, or working outside approved hours can lead to fines and an order to reinstate the work at your cost. As the flat owner you are responsible, even if your contractor made the mistake.</p>`,
      },
      {
        h2: 'A quick checklist before work starts',
        html: `<ul>
<li>Confirm your contractor appears in HDB's directory of registered renovation contractors, and note the licence number. <a href="/guides/casetrust-and-hdb-licence-explained">Here is how to check</a>.</li>
<li>Ask in writing who is applying for the permit and when approval is expected.</li>
<li>Get the list of works that need approval and make sure none start before it is granted.</li>
<li>Confirm the schedule respects permitted working days and hours.</li>
<li>Keep copies of the permit and your contract.</li>
</ul>
<p>Looking for a firm that works on HDB flats? See <a href="/interior-designers/hdb">HDB interior designers on Layered</a>, where firms can list their HDB licence number.</p>`,
      },
    ],
    faqs: [
      { q: 'Who applies for the HDB renovation permit?', a: 'The HDB-registered renovation contractor applies for the permit on the flat owner\'s behalf. Homeowners cannot apply directly for works that need a contractor.' },
      { q: 'Can I hack any wall in my HDB flat?', a: 'No. Structural walls, columns, beams and slabs cannot be removed. Non-structural partition walls can usually be hacked with a permit, but you should have your contractor confirm which walls in your flat are structural.' },
      { q: 'Can renovation work happen on Sundays or public holidays?', a: 'No. HDB does not allow renovation work on Sundays and public holidays, and noisy works such as hacking and drilling are limited to certain weekday hours. Check HDB for the latest schedule.' },
      { q: 'What if my contractor does work without a permit?', a: 'You, as the flat owner, can be fined and may have to reinstate the work at your own cost, so confirm which works need approval and that approval is granted before they start.' },
    ],
    related: ['hdb-renovation-cost-singapore', 'casetrust-and-hdb-licence-explained', 'how-to-choose-an-interior-designer-singapore'],
    links: [['/interior-designers/hdb', 'HDB interior designers']],
  },

  {
    slug: 'condo-renovation-cost-and-rules',
    title: 'Condo Renovation Cost & Rules in Singapore',
    h1: 'Condo renovation in Singapore: cost, MCST rules and approvals',
    description: 'What does a condo renovation cost in Singapore? Typical price per square foot, MCST approval and deposits, working hours and what to ask before you start.',
    summary: 'Cost per square foot, MCST approval and deposits, and what condo renovations involve.',
    intro: `<p>Condo renovations in Singapore differ from HDB projects in two big ways: there is no HDB permit, but there is a management corporation (MCST) with its own by-laws, and budgets tend to be shaped by square footage and finish level. This guide covers the typical costs and the approvals you will need.</p>`,
    sections: [
      {
        h2: 'Typical condo renovation cost in Singapore',
        html: `<p>For a full renovation, many Singapore guides quote roughly <strong>$50 to $120 per square foot</strong>, with cosmetic refreshes sitting lower and high-specification homes (stone, feature joinery, smart-home systems) well above that. By unit size, reported ranges for resale condos are roughly:</p>
<table class="data-table">
<thead><tr><th>Unit</th><th>Reported range</th></tr></thead>
<tbody>
<tr><td>2-bedroom</td><td>$47,900 – $71,100</td></tr>
<tr><td>3-bedroom</td><td>$60,400 – $84,100</td></tr>
<tr><td>4-bedroom</td><td>$66,300 – $92,400</td></tr>
</tbody>
</table>
<p>These are indicative figures for standard scopes. Your quote will depend on the layout, the condition of the unit and how much custom carpentry you want.</p>`,
      },
      {
        h2: 'MCST approval, deposits and by-laws',
        html: `<p>Every condo has its own management corporation or developer-managed office, and its own renovation rules. Before work starts you will typically need to:</p>
<ul>
<li>Submit a renovation application and get written approval.</li>
<li>Pay a refundable renovation deposit, which is used if common property is damaged. Amounts vary by development, commonly from around a thousand dollars to several thousand.</li>
<li>Use contractors that meet the condo's requirements, and register workers if the condo requires it.</li>
<li>Follow the condo's permitted working days and hours, which can be stricter than general rules.</li>
<li>Protect lifts, corridors and other common areas, and leave common property and structural elements untouched.</li>
</ul>
<p>Ask the management office for the current renovation guidelines <em>before</em> you finalise the schedule, and ask your designer whether they have worked in your development before.</p>`,
      },
      {
        h2: 'Structural and wet-area works',
        html: `<p>Changes that touch structure, or that affect waterproofing and plumbing in wet areas, need more care and may need professional sign-off. A good designer will tell you early which changes are straightforward and which need approvals, instead of finding out mid-project.</p>`,
      },
      {
        h2: 'Choosing a designer for a condo',
        html: `<p>Look for a firm with condo portfolios similar to your unit, ask what they include in their quote (design, project management, MCST paperwork) and compare at least three itemised quotes. Our guide to <a href="/guides/how-to-choose-an-interior-designer-singapore">choosing an interior designer</a> has a full checklist, and you can browse <a href="/interior-designers/condo">condo interior designers on Layered</a>.</p>`,
      },
    ],
    faqs: [
      { q: 'How much does it cost to renovate a condo in Singapore?', a: 'Many guides quote roughly $50 to $120 per square foot for a full renovation, with cosmetic refreshes lower and high-specification homes higher. Resale 2- to 4-bedroom condos are commonly reported between about $48,000 and $92,000 for standard scopes.' },
      { q: 'Do I need approval to renovate a condo?', a: 'Yes. Most condos require written approval from the management corporation or management office before work starts, plus a refundable renovation deposit and compliance with the condo\'s working hours and rules.' },
      { q: 'How much is a condo renovation deposit?', a: 'It depends on the development and the scope of work. Deposits are commonly from around one thousand dollars to several thousand dollars and are refunded if common property is not damaged.' },
      { q: 'Is condo renovation cheaper than HDB renovation?', a: 'Not usually. Condo renovations are generally priced per square foot on larger or higher-specification units, so total costs are often higher than a comparable HDB flat, though a small, lightly renovated unit can cost less.' },
    ],
    related: ['hdb-renovation-cost-singapore', 'how-to-choose-an-interior-designer-singapore', 'casetrust-and-hdb-licence-explained'],
    links: [['/interior-designers/condo', 'Condo interior designers']],
  },

  {
    slug: 'how-to-choose-an-interior-designer-singapore',
    title: 'How to Choose an Interior Designer in Singapore',
    h1: 'How to choose an interior designer in Singapore: a practical checklist',
    description: 'A step-by-step checklist for choosing an interior designer or renovation contractor in Singapore: portfolios, quotes, credentials, contracts and red flags.',
    summary: 'A step-by-step checklist: portfolios, quotes, credentials, contracts and red flags.',
    intro: `<p>Renovation is one of the largest purchases most homeowners make, and complaints about renovation firms are common enough that it pays to be systematic. This checklist walks you from shortlist to signed contract.</p>`,
    sections: [
      {
        h2: 'Interior designer, design-and-build firm or contractor?',
        html: `<p>An <strong>interior design firm</strong> typically handles concept, drawings, project management and the build, often through its own or partner contractors. A <strong>renovation contractor</strong> focuses on executing the works and may leave the design to you. In Singapore, many firms do both. Pick the model that matches how much design help you want, and be clear about who is responsible for what in writing.</p>`,
      },
      {
        h2: 'Step 1: Shortlist by project type, style and budget',
        html: `<p>Look for firms that regularly do your kind of property: an HDB specialist will know permit and space-saving details, while a condo specialist will know MCST processes. Use the <a href="/designers">Layered directory</a> to filter by property type and style, or jump to <a href="/interior-designers/hdb">HDB</a>, <a href="/interior-designers/condo">condo</a>, <a href="/interior-designers/landed">landed</a> or <a href="/interior-designers/commercial">commercial</a> designers.</p>`,
      },
      {
        h2: 'Step 2: Check credentials',
        html: `<ul>
<li><strong>HDB-registered</strong> if you live in an HDB flat, because only registered contractors can apply for renovation permits.</li>
<li><strong>CaseTrust accreditation</strong> (CaseTrust, CaseTrust-RCMA or CaseTrust Gold) for consumer-protection safeguards such as deposit protection and a standard contract.</li>
</ul>
<p>Verify these on the official lookups instead of taking a badge at face value. We explain how in <a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust and HDB licence explained</a>.</p>`,
      },
      {
        h2: 'Step 3: Review portfolios and visit completed work',
        html: `<p>Look for projects similar in size and style to yours. Ask what the final cost and timeline were, whether the work finished on schedule and whether you can speak to a past client or visit a completed home.</p>`,
      },
      {
        h2: 'Step 4: Compare itemised quotes',
        html: `<p>Collect at least three quotes broken down by work type, with materials and brands specified. A suspiciously low total often hides missing items or lower-grade materials. Our <a href="/guides/hdb-renovation-cost-singapore">HDB renovation cost guide</a> and <a href="/guides/condo-renovation-cost-and-rules">condo guide</a> show typical ranges to sanity-check against.</p>`,
      },
      {
        h2: 'Step 5: Read the contract and payment schedule',
        html: `<ul>
<li>Scope, materials, timeline and the total price should all be in writing.</li>
<li>Payments should be staged against progress; be wary of a large upfront deposit.</li>
<li>Check how variations, delays and defects are handled, and the defects liability period.</li>
<li>Confirm who applies for permits and handles management-corporation approvals.</li>
</ul>`,
      },
      {
        h2: 'Red flags to watch for',
        html: `<ul>
<li>Pressure to sign or pay a large deposit immediately.</li>
<li>No written contract, or a vague scope.</li>
<li>Unwillingness to share a company registration number, licence or past projects.</li>
<li>A quote far below the others with no explanation.</li>
</ul>`,
      },
    ],
    faqs: [
      { q: 'What is the difference between an interior designer and a renovation contractor?', a: 'An interior design firm usually handles design, drawings and project management as well as the build, while a renovation contractor focuses on carrying out the works. Many Singapore firms offer both, so clarify who is responsible for design, permits and site supervision.' },
      { q: 'How many quotes should I get?', a: 'At least three itemised quotes. Itemisation matters more than the number, because it lets you compare scope and materials rather than just a headline price.' },
      { q: 'How much deposit is reasonable?', a: 'Payments should be staged against progress rather than front-loaded. CaseTrust-accredited renovation firms follow a standard contract and offer deposit protection, so ask any firm how your deposit is protected.' },
      { q: 'Should my designer be HDB-registered?', a: 'If you are renovating an HDB flat, yes. Works that need an HDB permit must be carried out by an HDB-registered contractor, and you can check the licence number in HDB\'s directory.' },
    ],
    related: ['casetrust-and-hdb-licence-explained', 'hdb-renovation-cost-singapore', 'condo-renovation-cost-and-rules'],
    links: [['/designers', 'Browse all designers']],
  },

  {
    slug: 'casetrust-and-hdb-licence-explained',
    title: 'CaseTrust & HDB Licence for Renovation, Explained',
    h1: 'CaseTrust and HDB licence explained: how to check a renovation firm',
    description: 'What an HDB renovation contractor licence and CaseTrust, CaseTrust-RCMA and CaseTrust Gold accreditation mean, and how to verify them before you sign.',
    summary: 'What each credential means, how they differ and how to verify them yourself.',
    intro: `<p>Renovation firms in Singapore often advertise an HDB licence or a CaseTrust logo. They are different things and protect you in different ways. Here is what each one means and how to check it.</p>`,
    sections: [
      {
        h2: 'HDB-registered renovation contractor (HDB licence)',
        html: `<p>HDB keeps a directory of renovation contractors registered with it. If you are renovating an HDB flat, works that need an HDB renovation permit must be done by a registered contractor, who also applies for the permit. A listed firm has a licence number, and the directory shows details such as its status and validity.</p>
<p><strong>How to check:</strong> ask the firm for its exact registered company name and licence number, then look it up on <a href="https://services2.hdb.gov.sg/webapp/BN31AWERRCMobile/BN31PContractorDetail.jsp" rel="noopener noreferrer" target="_blank">HDB's contractor lookup</a> and confirm they match and the registration is current.</p>
<p>An HDB registration tells you the firm may carry out HDB works. It is not a guarantee of workmanship or a consumer-protection scheme.</p>`,
      },
      {
        h2: 'CaseTrust: the Consumers Association of Singapore accreditation',
        html: `<p>CaseTrust is run by the Consumers Association of Singapore (CASE). For renovation businesses it focuses on fair business practices and consumer protection, including a standard renovation contract and protection for the deposits you pay. There are three versions you may see:</p>
<table class="data-table">
<thead><tr><th>Accreditation</th><th>Who it is for</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><strong>CaseTrust</strong></td><td>Renovation businesses that are not members of RCMA</td><td>The standard accreditation for renovation businesses.</td></tr>
<tr><td><strong>CaseTrust-RCMA</strong></td><td>Members of the Renovation Contractors &amp; Material Suppliers Association (RCMA)</td><td>A joint accreditation scheme with RCMA. Core consumer protections are the same as CaseTrust.</td></tr>
<tr><td><strong>CaseTrust Gold</strong></td><td>Renovation businesses meeting a higher standard</td><td>The top tier, with enhanced protections such as 50% prepayment protection through an approved instrument, for example an insurance bond or banker's guarantee.</td></tr>
</tbody>
</table>
<p>The difference between CaseTrust and CaseTrust-RCMA is about which industry body the firm belongs to, not how much protection you get. Gold is a higher protection level.</p>
<p><strong>How to check:</strong> look for the CaseTrust logo and confirm the firm on <a href="https://www.case.org.sg/casetrust/" rel="noopener noreferrer" target="_blank">CASE's CaseTrust website</a>, including that the accreditation has not expired.</p>`,
      },
      {
        h2: 'How credentials appear on Layered',
        html: `<p>On Layered, firms can list their HDB licence number and their CaseTrust accreditation (CaseTrust, CaseTrust-RCMA or CaseTrust Gold). These are <strong>self-declared by the firm and not verified by Layered</strong>. Treat them as a prompt to check, not as proof. You can filter the <a href="/designers">designer directory</a> by these credentials, then confirm them on the official lookups above.</p>`,
      },
      {
        h2: 'What neither credential guarantees',
        html: `<p>Neither badge guarantees design quality or that a project will go smoothly. Use them alongside a portfolio review, itemised quotes and a clear written contract. Our <a href="/guides/how-to-choose-an-interior-designer-singapore">checklist for choosing an interior designer</a> covers the rest.</p>`,
      },
    ],
    faqs: [
      { q: 'What is the difference between CaseTrust and CaseTrust-RCMA?', a: 'Both are CASE accreditations for renovation businesses with the same core consumer protections. CaseTrust-RCMA is a joint scheme for members of the Renovation Contractors and Material Suppliers Association, while CaseTrust is for renovation businesses that are not RCMA members.' },
      { q: 'What does CaseTrust Gold mean?', a: 'Gold is the highest CaseTrust tier for renovation businesses. It includes enhanced protections such as 50% prepayment protection through an approved instrument like an insurance bond or banker\'s guarantee.' },
      { q: 'How do I check if a contractor has an HDB licence?', a: 'Ask for the exact registered company name and licence number, then look the company up on HDB\'s contractor lookup and confirm the details match and the registration is current.' },
      { q: 'Does Layered verify the credentials firms list?', a: 'No. Credentials on Layered are self-declared by each firm and clearly labelled that way. Always confirm them with HDB and CaseTrust before signing a contract.' },
    ],
    related: ['hdb-renovation-permit-and-rules', 'how-to-choose-an-interior-designer-singapore', 'hdb-renovation-cost-singapore'],
    links: [['/designers', 'Browse all designers']],
  },
];

export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;
