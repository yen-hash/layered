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
        html: `<p>On Layered, firms can list their HDB licence number and their CaseTrust accreditation (CaseTrust, CaseTrust-RCMA or CaseTrust Gold). Credentials are <strong>self-declared by the firm</strong> by default. When our team has checked a firm against HDB's and CASE's own lookups, the badge carries a tick and the date of the check, and the profile says so. Everything else is shown as self-declared. Either way, treat a badge as a prompt to check, not as proof, because registrations can lapse. You can filter the <a href="/designers">designer directory</a> by these credentials, including firms we have checked, then confirm them on the official lookups above.</p>`,
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
      { q: 'Does Layered verify the credentials firms list?', a: 'Not by default. Credentials are self-declared by each firm and labelled that way. Where our team has checked a firm against the official HDB and CaseTrust lookups, the badge shows a tick and the date of the check. Registrations can lapse, so always confirm with HDB and CaseTrust before signing a contract.' },
    ],
    related: ['hdb-renovation-permit-and-rules', 'how-to-choose-an-interior-designer-singapore', 'hdb-renovation-cost-singapore'],
    links: [['/designers', 'Browse all designers']],
  },
  {
    slug: 'renovation-for-beginners-singapore',
    title: 'Renovation for Beginners in Singapore',
    h1: 'Renovation for beginners in Singapore: a step-by-step guide',
    description: 'First time renovating in Singapore? A plain-English guide to budgeting, hiring, permits, the order of works and handover, with links to our tools and checklists.',
    summary: 'A plain-English walk through the whole renovation, from budget to handover, for first-time owners.',
    intro: `<p>If this is your first renovation, the process can feel like a maze of unfamiliar terms, quotes and approvals. It is easier once you see it as eight steps in a fixed order. This guide walks through them in plain English and points to our free tools for each one: the <a href="/tools/renovation-cost-calculator">cost calculator</a>, the <a href="/guides/renovation-checklist-singapore">renovation checklist</a> and the <a href="/guides/renovation-glossary-singapore">glossary of renovation terms</a>.</p>
<p>Figures and rules here are general guidance. HDB, your condo's management office and the firms you hire set the details, so confirm them before you commit.</p>`,
    sections: [
      {
        h2: 'The eight steps at a glance',
        html: `<ol>
<li><strong>Decide the scope.</strong> A light refresh or a full overhaul?</li>
<li><strong>Set a budget</strong> with a buffer.</li>
<li><strong>Choose who to hire:</strong> an interior design firm, a contractor, or a package.</li>
<li><strong>Collect and compare quotations</strong> on the same brief.</li>
<li><strong>Check credentials and sign a written contract.</strong></li>
<li><strong>Get the permits and approvals</strong> your home needs.</li>
<li><strong>Follow the works</strong> in the right order and visit the site.</li>
<li><strong>Inspect at handover</strong> and use the warranty for defects.</li>
</ol>
<p>Most of the money and most of the mistakes sit in steps 2 to 5, so spend your time there.</p>`,
      },
      {
        h2: 'Step 1: Decide what kind of renovation you need',
        html: `<p>Start with the state of the home, not the style. A <strong>new BTO flat</strong> usually needs finishing and carpentry rather than demolition. A <strong>resale flat</strong> often needs old floors, bathrooms or wiring replaced, which costs more and takes longer. A <strong>condo</strong> may arrive with finishes already installed. Write down what must change, what would be nice, and what can wait. That list is the brief you will give every firm. Our guides to <a href="/guides/hdb-renovation-cost-singapore">HDB renovation cost</a> and <a href="/guides/condo-renovation-cost-and-rules">condo renovation</a> show what is typical for each.</p>`,
      },
      {
        h2: 'Step 2: Set a budget (and keep a buffer)',
        html: `<p>Use the <a href="/tools/renovation-cost-calculator">renovation cost calculator</a> to get an indicative range for your home, then add a <strong>buffer of about 10 to 15%</strong> for changes and surprises. Remember what quotes often leave out: furniture, appliances, curtains, and sometimes permit or management fees. If you need financing, read how <a href="/blog/renovation-loan-singapore-how-it-works">renovation loans work</a> before you sign anything.</p>`,
      },
      {
        h2: 'Step 3: Choose who to hire',
        html: `<p>You generally have three routes:</p>
<ul>
<li><strong>An interior design firm</strong> designs, manages and builds. You pay for design and coordination, and you get one point of contact.</li>
<li><strong>A contractor</strong> builds to your plans. It can cost less, but you do more of the design and coordination yourself.</li>
<li><strong>A renovation package</strong> offers a fixed scope at a set price. It is simple, but changes cost extra. Our article on <a href="/blog/renovation-package-vs-custom-design-singapore">package vs custom design</a> explains the trade-offs.</li>
</ul>
<p>Whichever you choose, <a href="/designers">browse designers</a> and look at finished projects in your type of home, not only the best photos.</p>`,
      },
      {
        h2: 'Step 4: Compare quotations properly',
        html: `<p>Give every firm the same brief, then compare quotes line by line, not by total. A cheap quote often leaves things out that appear later as extra charges. Our guide to <a href="/blog/how-to-read-a-renovation-quotation-singapore">reading a renovation quotation</a> explains terms such as provisional sums and variation orders, and shows how to line up three quotes fairly.</p>`,
      },
      {
        h2: 'Step 5: Check credentials and sign a contract',
        html: `<p>Before paying a deposit, confirm the firm's licences and accreditation on the official lookups. See <a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust and HDB licences explained</a> and <a href="/blog/how-to-check-hdb-licensed-contractor">how to check an HDB licensed contractor</a>. Then insist on a written contract that attaches the itemised quote and drawings. <a href="/blog/renovation-contract-singapore-what-to-check">Nine clauses to check</a> covers payments, timelines and warranties. Keep the deposit small and tie later payments to finished work.</p>`,
      },
      {
        h2: 'Step 6: Permits and approvals',
        html: `<p>Certain works in an HDB flat need an HDB renovation permit, and the work must be done by a contractor registered with HDB. Condos usually need written approval from the management office, and often a refundable deposit. Both set rules on working hours and noise. Read our <a href="/guides/hdb-renovation-permit-and-rules">HDB permit and rules guide</a> and the <a href="/blog/condo-renovation-approval-singapore">condo approval steps</a>, and let your designer handle the paperwork where possible. Do not let works start before approval.</p>`,
      },
      {
        h2: 'Step 7: What happens during the works',
        html: `<p>Most renovations follow this order, because later trades depend on earlier ones:</p>
<ol>
<li>Protection of common areas and removal of old finishes (hacking), if needed</li>
<li>Electrical and plumbing</li>
<li>Waterproofing, then tiling and screeding (wet works)</li>
<li>Ceiling and partitions</li>
<li>Carpentry (built-in cabinets and wardrobes)</li>
<li>Painting and finishing</li>
<li>Installation of lights, fittings, glass and appliances, then cleaning</li>
</ol>
<p>Visit the site regularly, take dated photos, and approve any change in writing with its price before the work is done. Late changes are the most common cause of budget overruns. A realistic <a href="/blog/bto-renovation-timeline-singapore">BTO renovation timeline</a> and a <a href="/blog/condo-renovation-timeline-singapore">condo timeline</a> help you plan your move-in date.</p>`,
      },
      {
        h2: 'Step 8: Handover and defects',
        html: `<p>Do a proper walk-through: test every tap, switch, socket, door and drawer, and inspect tiles, paint and silicone. Write a signed defects list with dates to fix each item, and hold back the final payment until it is done. Read how the <a href="/blog/defects-liability-period-singapore">defects liability period</a> works so you know what is covered.</p>`,
      },
      {
        h2: 'Mistakes first-time renovators make',
        html: `<ul>
<li>Having no buffer for changes and hidden problems</li>
<li>Agreeing to things verbally instead of in the contract</li>
<li>Paying a large deposit up front</li>
<li>Choosing the cheapest quote without comparing what is included</li>
<li>Making design changes after works have started</li>
<li>Skipping the handover inspection</li>
</ul>
<p>Our article on <a href="/blog/renovation-mistakes-singapore">renovation mistakes and how to avoid them</a> goes through each in detail.</p>`,
      },
    ],
    faqs: [
      { q: 'Where do I start if I have never renovated before?', a: 'Start with your scope and budget. Use the cost calculator for a range, add a 10 to 15% buffer, then gather quotations from a few firms on the same brief. Our renovation checklist puts every step in order.' },
      { q: 'Do I need an interior designer, or can I hire a contractor directly?', a: 'Either works. A design firm handles design, coordination and building for one price, while a contractor builds to plans you provide. Pick based on how much design and project management you want to do yourself.' },
      { q: 'How long does a renovation take?', a: 'The works alone commonly take several weeks to a few months depending on scope, and the planning and approval stages add to that. See our BTO and condo timelines for typical stage lengths.' },
      { q: 'Can I live in the flat during renovation?', a: 'Most owners do not, because of dust, noise and unusable bathrooms and kitchens. Plan alternative accommodation, especially for a full renovation.' },
      { q: 'What should I check before signing with a firm?', a: 'Confirm its licences and accreditation, read the whole contract, make sure the itemised quote and drawings are attached, keep the deposit small, and tie payments to progress.' },
    ],
    related: ['hdb-renovation-cost-singapore', 'how-to-choose-an-interior-designer-singapore'],
    links: [['/tools/renovation-cost-calculator', 'Cost calculator'], ['/guides/renovation-checklist-singapore', 'Renovation checklist'], ['/designers', 'Browse designers']],
  },

  {
    slug: 'renovation-glossary-singapore',
    title: 'Renovation Glossary for Singapore Homeowners',
    h1: 'Renovation terms explained: a glossary for Singapore homeowners',
    description: 'Plain-English meanings of renovation terms you will meet in Singapore quotes and contracts, from hacking and wet works to provisional sums and DLP.',
    summary: 'Plain-English meanings of the terms in Singapore renovation quotes and contracts.',
    intro: `<p>Renovation quotes and contracts are full of shorthand. Here are the terms Singapore homeowners meet most often, in plain English. Firms use some of them slightly differently, so if a word in your quote is unclear, ask what it covers. For the whole process, read our <a href="/guides/renovation-for-beginners-singapore">beginner's guide</a>.</p>`,
    sections: [
      {
        h2: 'Your home and the paperwork',
        html: `<table class="data-table">
<thead><tr><th>Term</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><strong>BTO</strong></td><td>Build-To-Order flat, a new HDB flat you buy before it is built.</td></tr>
<tr><td><strong>Resale flat</strong></td><td>An HDB flat bought from a current owner, usually older and often needing more work.</td></tr>
<tr><td><strong>Key collection</strong></td><td>The day you collect the keys to a new BTO flat, when you can start renovating.</td></tr>
<tr><td><strong>HDB renovation permit</strong></td><td>Approval from HDB for certain works in a flat, applied for through a registered contractor.</td></tr>
<tr><td><strong>HDB-registered contractor</strong></td><td>A contractor on HDB's list, required for works that need a permit.</td></tr>
<tr><td><strong>MCST</strong></td><td>Management Corporation Strata Title, the body that runs a condo and sets its renovation rules.</td></tr>
<tr><td><strong>Renovation deposit</strong></td><td>A refundable sum many condos ask for before works begin, returned if common areas are left undamaged.</td></tr>
<tr><td><strong>CaseTrust</strong></td><td>An accreditation by the Consumers Association of Singapore for businesses with consumer safeguards. See <a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust explained</a>.</td></tr>
</tbody>
</table>`,
      },
      {
        h2: 'People and ways of hiring',
        html: `<table class="data-table">
<thead><tr><th>Term</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><strong>ID (interior designer) firm</strong></td><td>A firm that designs, manages and often builds. Also called design-and-build.</td></tr>
<tr><td><strong>Contractor</strong></td><td>A business that carries out the construction work to a design or brief.</td></tr>
<tr><td><strong>Renovation package</strong></td><td>A fixed scope at a set price, with extras charged separately.</td></tr>
<tr><td><strong>Subcontractor</strong></td><td>A specialist (electrician, tiler, carpenter) hired by the main firm.</td></tr>
<tr><td><strong>Project manager</strong></td><td>The person who coordinates trades and schedules on site.</td></tr>
</tbody>
</table>`,
      },
      {
        h2: 'The works',
        html: `<table class="data-table">
<thead><tr><th>Term</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><strong>Hacking</strong></td><td>Breaking out old tiles, screed, cabinets or non-structural walls.</td></tr>
<tr><td><strong>Wet works</strong></td><td>Work using water-based materials: waterproofing, screeding, tiling.</td></tr>
<tr><td><strong>Waterproofing</strong></td><td>A membrane applied in wet areas such as bathrooms to stop leaks.</td></tr>
<tr><td><strong>Screed</strong></td><td>A thin layer of cement leveling the floor before tiling.</td></tr>
<tr><td><strong>Overlay</strong></td><td>Laying new tiles or flooring over existing ones instead of hacking them off.</td></tr>
<tr><td><strong>Electrical point</strong></td><td>One socket, switch or light connection. Quotes often count and price points.</td></tr>
<tr><td><strong>False ceiling</strong></td><td>A lowered ceiling that hides pipes and wiring and holds lights.</td></tr>
<tr><td><strong>Cove light</strong></td><td>Hidden lighting set into a ceiling edge or recess.</td></tr>
<tr><td><strong>Built-in carpentry</strong></td><td>Cabinets and wardrobes made to fit your home, as opposed to loose furniture.</td></tr>
<tr><td><strong>Feet run (ft run)</strong></td><td>A way of pricing carpentry by length of cabinet in feet.</td></tr>
</tbody>
</table>`,
      },
      {
        h2: 'Materials',
        html: `<table class="data-table">
<thead><tr><th>Term</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><strong>Laminate</strong></td><td>A durable printed surface bonded to a board. See <a href="/blog/laminate-vs-veneer-vs-solid-wood-carpentry-singapore">laminate vs veneer vs solid wood</a>.</td></tr>
<tr><td><strong>Veneer</strong></td><td>A thin slice of real wood glued to a board.</td></tr>
<tr><td><strong>Quartz</strong></td><td>An engineered stone often used for kitchen countertops.</td></tr>
<tr><td><strong>Vinyl flooring</strong></td><td>Plank flooring in plastic-based materials that often imitates timber. See <a href="/blog/hdb-flooring-options-vinyl-tiles-timber">HDB flooring options</a>.</td></tr>
<tr><td><strong>Homogeneous tile</strong></td><td>A dense tile with the same material and color all the way through.</td></tr>
</tbody>
</table>`,
      },
      {
        h2: 'Money and contracts',
        html: `<table class="data-table">
<thead><tr><th>Term</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><strong>Quotation</strong></td><td>The firm's priced offer. See <a href="/blog/how-to-read-a-renovation-quotation-singapore">how to read a quotation</a>.</td></tr>
<tr><td><strong>Provisional sum (PS)</strong></td><td>A placeholder amount for something not yet specified.</td></tr>
<tr><td><strong>Variation order (VO)</strong></td><td>A signed change to the scope, with its price.</td></tr>
<tr><td><strong>Deposit</strong></td><td>The first payment, paid on signing. Keep it small.</td></tr>
<tr><td><strong>Progress payment</strong></td><td>A payment tied to a finished stage of the work.</td></tr>
<tr><td><strong>Retention</strong></td><td>A final portion held back until defects are fixed.</td></tr>
<tr><td><strong>Defects liability period (DLP)</strong></td><td>The period after handover when the firm must fix defects. See <a href="/blog/defects-liability-period-singapore">the DLP explained</a>.</td></tr>
<tr><td><strong>Punch list</strong></td><td>The signed list of defects found at handover, with dates for fixing them.</td></tr>
<tr><td><strong>Handover</strong></td><td>The point where the finished home is inspected and accepted.</td></tr>
</tbody>
</table>`,
      },
    ],
    faqs: [
      { q: 'What is the difference between hacking and wet works?', a: 'Hacking is breaking out old finishes. Wet works are the water-based tasks that follow, such as waterproofing, screeding and tiling.' },
      { q: 'What is a provisional sum in a renovation quote?', a: 'A placeholder amount for an item that has not been specified yet. Ask what it covers and who pays if the real cost differs.' },
      { q: 'What does DLP mean?', a: 'DLP stands for defects liability period, the time after handover when the firm must fix defects at its own cost, as set out in your contract.' },
      { q: 'What is a variation order?', a: 'A written change to the agreed scope with its price. Approve each one in writing before the work is done.' },
    ],
    related: ['renovation-for-beginners-singapore', 'how-to-choose-an-interior-designer-singapore'],
    links: [['/guides/renovation-for-beginners-singapore', "Beginner's guide"], ['/tools/renovation-cost-calculator', 'Cost calculator']],
  },
];

export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;
