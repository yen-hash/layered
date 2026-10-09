// routes/services.js — renovation trades (/services, /services/<trade>) and the premium landed A&A and
// rebuild section (/landed). Businesses join a category at signup; these pages list them and route quote
// requests to the right firms.
import { db } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { abs, breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { TRADES, TRADE_BY_SLUG, LANDED_PROS, LANDED_COSTS, LANDED_SOURCES, LANDED_REVIEWED, landedEstimate } from '../content/trades.js';
import { designerCard, quoteFormHtml } from './public.js';

const firmsIn = (category) => db.prepare('SELECT * FROM businesses WHERE category = ? ORDER BY featured DESC, created_at DESC').all(category);
const countIn = (category) => db.prepare('SELECT COUNT(*) AS n FROM businesses WHERE category = ?').get(category).n;
const money = (n) => `S$${Math.round(n).toLocaleString('en-SG')}`;
const pct = ([a, b]) => `${Math.round(a * 100)}% to ${Math.round(b * 100)}%`;

const notFound = (res, ctx) => {
  res.statusCode = 404;
  res.end(layout({ title: 'Page not found', noindex: true, site: ctx.site, business: ctx.business, body: '<div class="wrap" style="padding:60px 0;"><h1>404 — Page not found</h1><p><a href="/services">All renovation services</a></p></div>' }));
};

const firmGrid = (firms, category, noun) => (firms.length
  ? `<div class="grid grid-3">${firms.map(designerCard).join('')}</div>`
  : `<div class="empty-firms"><p>No ${esc(noun)} are listed yet. You can still send a request below and we will pass it on as firms join.</p><p><a class="btn btn-sm btn-outline" href="/signup?category=${esc(category)}">List your business here, free</a></p></div>`);

// ----- /services -----
export async function servicesIndexRoute(req, res, ctx) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Renovation services', path: '/services' }];
  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <h1>Renovation services in Singapore</h1>
    <p class="section-sub">Beyond your interior designer: find lighting, curtains, movers, aircon, flooring and the other trades you need to finish and move into your home, plus architects and builders for landed homes.</p>
  </section>
  <section class="wrap">
    <a class="card landed-feature" href="/landed">
      <div class="body"><span class="eyebrow">Premium</span><h2>Landed A&amp;A and rebuild</h2><p>Architects, structural engineers (QPs) and landed builders in one place, with costs, approvals and timelines explained.</p><span class="more">Explore landed →</span></div>
    </a>
    <h2>Renovation trades</h2>
    <div class="grid grid-3 trade-grid">
      ${TRADES.map((t) => {
        const n = countIn(t.slug);
        return `<a class="card trade-card" href="/services/${t.slug}"><div class="body"><h3>${esc(t.plural)}</h3><p class="muted small">${esc(t.intro.split('. ')[0])}.</p><span class="more">${n ? `${n} listed` : 'Request quotes'} →</span></div></a>`;
      }).join('')}
    </div>
    <div class="cta-box">
      <h2>Are you a renovation trade or landed specialist?</h2>
      <p>Homeowners planning a renovation are already on Layered. List your business free and receive quote requests for your trade.</p>
      <p><a class="btn btn-sm" href="/signup">List your business</a></p>
    </div>
  </section>`;
  res.end(layout({
    title: 'Renovation Services and Trades in Singapore',
    description: 'Find renovation trades in Singapore: lighting, curtains, movers, aircon, flooring, carpentry, electricians, plumbers and more, plus landed architects and builders.',
    path: '/services', site: ctx.site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: breadcrumbSchema(ctx.site, crumbs),
  }));
}

// ----- /services/<trade> -----
export async function tradeRoute(req, res, ctx, slug) {
  const t = TRADE_BY_SLUG[slug];
  if (!t) return notFound(res, ctx);
  const path = `/services/${t.slug}`;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Renovation services', path: '/services' }, { name: t.plural, path }];
  const firms = firmsIn(t.slug);
  const related = TRADES.filter((x) => x.slug !== t.slug).slice(0, 6);
  const tools = [
    t.estimator && '<a href="/tools/renovation-cost-estimator">itemised cost estimator</a>',
    t.planner && '<a href="/tools/room-planner">room planner</a>',
  ].filter(Boolean);
  const faqs = [
    ...t.faqs,
    { q: `How do I get quotes from ${t.plural.toLowerCase()} on Layered?`, a: 'Send one request with the form on this page. It goes to the firms listed in this category, and they reply to you directly by email or phone. It is free for homeowners.' },
  ];
  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <span class="eyebrow">Renovation services</span>
    <h1>${esc(t.title)}</h1>
    <p class="section-sub">${esc(t.intro)}${tools.length ? ` Use our ${tools.join(' and ')} to plan quantities first.` : ''}</p>
  </section>
  <section class="wrap">
    <h2>${esc(t.plural)} on Layered</h2>
    ${firmGrid(firms, t.slug, t.plural.toLowerCase())}
  </section>
  <section class="wrap prose-section">
    <div class="grid grid-2">
      <div>
        <h2>What to check before you hire</h2>
        <ul class="check-list">${t.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        ${faqHtml(faqs)}
      </div>
      <div>${quoteFormHtml(t.slug, `Request quotes from ${t.plural.toLowerCase()}`, 'One request, sent to the firms listed here. Free for homeowners.')}</div>
    </div>
    <section class="related"><h2>Other renovation services</h2><ul>
      ${related.map((r) => `<li><a href="/services/${r.slug}">${esc(r.plural)}</a></li>`).join('')}
      <li><a href="/services">All renovation services</a></li>
      <li><a href="/designers">Interior designers</a></li>
    </ul></section>
  </section>`;
  res.end(layout({
    title: t.title, description: t.description, path, site: ctx.site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [breadcrumbSchema(ctx.site, crumbs), faqSchema(faqs)],
  }));
}

// ----- /landed -----
const LANDED_FAQS = [
  { q: 'Should I do A&A or rebuild my landed house?', a: 'A&A keeps the existing structure and changes or adds to it, so it is usually faster and cheaper per square foot. Reconstruction demolishes the house and builds a new one, which lets you redesign completely and use the full planning allowance, but takes longer and costs more. An architect can assess what your plot allows before you decide.' },
  { q: 'Who is the Qualified Person (QP)?', a: 'The QP is the registered architect or professional engineer who prepares and submits plans to the authorities and supervises the works for compliance. Structural changes need a QP and BCA approval.' },
  { q: 'Do I need URA approval for landed A&A?', a: 'Works that change the footprint, height or use of the house, such as adding a storey or extending it, generally need URA planning permission before work starts. Your architect will advise what applies to your plot.' },
  { q: 'How long does a landed rebuild take?', a: 'Approvals commonly take three to six months before construction starts, and a full reconstruction often takes 18 to 24 months or more from design to completion. A&A is typically 3 to 12 months depending on scope.' },
  { q: 'Are professional fees included in construction rates?', a: 'No. Construction rates per square foot usually cover the building works and the contractor\'s margin. Architect and engineer fees, demolition, authority submissions and interiors are budgeted separately.' },
];

export async function landedRoute(req, res, ctx) {
  const path = '/landed';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Landed A&A and rebuild', path }];
  const C = LANDED_COSTS;
  const rebuildRows = Object.values(C.rebuild).map((r) => `<tr><td><strong>${esc(r.label)}</strong></td><td>S$${r.mid[0]} – S$${r.mid[1]}</td><td>S$${r.premium[0]} – S$${r.premium[1]}</td></tr>`).join('');
  const ex = landedEstimate({ scope: 'rebuild', type: 'semid', spec: 'mid', gfa: 3500 }, C);
  const pros = LANDED_PROS.map((p) => ({ ...p, firms: firmsIn(p.slug) }));

  const body = `
  <section class="landed-hero">
    <div class="wrap">
      ${breadcrumbNav(crumbs)}
      <span class="eyebrow">Layered Landed</span>
      <h1>Landed A&amp;A and rebuild in Singapore</h1>
      <p class="lead">A landed rebuild is a seven-figure project that needs an architect, a structural engineer and a builder working together. Understand the costs, approvals and timeline, then find the team.</p>
      <p><a class="btn" href="#brief">Send a project brief</a> <a class="btn btn-outline" href="#costs">Estimate your budget</a></p>
    </div>
  </section>

  <section class="wrap prose-section">
    <h2>A&amp;A, reconstruction or new erection?</h2>
    <div class="table-scroll"><table class="data-table">
      <thead><tr><th>Scope</th><th>What it means</th><th>Typical duration</th></tr></thead>
      <tbody>
        <tr><td><strong>Addition and alteration (A&amp;A)</strong></td><td>Keep the existing structure and change or extend it, such as a new extension, roof terrace or reconfigured rooms.</td><td>3 to 12 months</td></tr>
        <tr><td><strong>Reconstruction (rebuild)</strong></td><td>Demolish the existing house and build a new one on the same plot.</td><td>18 to 24 months or more</td></tr>
        <tr><td><strong>New erection</strong></td><td>Build on a cleared or empty plot.</td><td>Similar to reconstruction</td></tr>
      </tbody>
    </table></div>

    <h2>The team you need</h2>
    <div class="grid grid-3 landed-team">
      ${pros.map((p) => `<div class="card"><div class="body"><h3>${esc(p.plural)}</h3><p class="muted small">${esc(p.blurb)}</p></div></div>`).join('')}
    </div>
    <p class="muted small">Most owners also bring in an interior designer for the finishes and built-ins. <a href="/interior-designers/landed">See landed interior designers</a>.</p>

    <h2>Approvals, in order</h2>
    <ol class="prose">
      <li><strong>Feasibility and design.</strong> Your architect checks what the plot allows (height, setbacks, storeys) and develops the design.</li>
      <li><strong>URA planning permission</strong> for reconstruction, and for A&amp;A that changes the footprint, height or use. First responses commonly take about 6 to 8 weeks, and each round of queries adds time.</li>
      <li><strong>BCA building plan and structural plan approval</strong>, prepared by the QPs. First responses commonly take a few weeks.</li>
      <li><strong>Permit to start works</strong>, then construction under the QP's supervision.</li>
      <li><strong>Completion and handover</strong>, including the authority sign-offs the QP arranges.</li>
    </ol>
    <p>Plan for roughly <strong>3 to 6 months of design and approvals</strong> before work starts on site. Check the latest requirements with your architect; this is a general guide, not advice for your plot.</p>
  </section>

  <section class="wrap prose-section" id="costs">
    <h2>What a landed rebuild costs in 2026</h2>
    <p>Construction rates per square foot of gross floor area, as published by Singapore builders and architects in 2026. They cover the building works and the contractor's margin, not fees, demolition or interiors.</p>
    <div class="table-scroll"><table class="data-table">
      <thead><tr><th>House type (rebuild)</th><th>Mid specification, per sq ft</th><th>Premium, per sq ft</th></tr></thead>
      <tbody>${rebuildRows}<tr><td><strong>${esc(C.aa.label)}</strong></td><td colspan="2">S$${C.aa.psf[0]} – S$${C.aa.psf[1]} per sq ft of affected area</td></tr></tbody>
    </table></div>
    <ul>
      <li><strong>Architect's fees:</strong> commonly ${pct(C.architectFee)} of construction cost, depending on the scope of service.</li>
      <li><strong>Structural engineer's fees:</strong> commonly ${pct(C.engineerFee)} of construction cost.</li>
      <li><strong>Demolition and debris removal</strong> for a rebuild: about ${money(C.demolition[0])} to ${money(C.demolition[1])}.</li>
      <li><strong>Authority submissions:</strong> around ${money(C.submissions)}.</li>
    </ul>
    <p>Example: a 3,500 sq ft semi-detached rebuild at mid specification comes to roughly <strong>${money(ex.total[0])} to ${money(ex.total[1])}</strong> including fees, demolition and submissions, before interiors.</p>

    <div class="calc landed-calc" id="landed-calc">
      <h3>Landed budget estimator</h3>
      <form class="landed-calc-form" onsubmit="return false" novalidate>
        <div class="field"><label for="l-scope">Scope</label><select id="l-scope"><option value="rebuild">Reconstruction / rebuild</option><option value="aa">Addition and alteration (A&amp;A)</option></select></div>
        <div class="field" id="l-type-wrap"><label for="l-type">House type</label><select id="l-type">${Object.entries(C.rebuild).map(([k, r]) => `<option value="${k}"${k === 'semid' ? ' selected' : ''}>${esc(r.label)}</option>`).join('')}</select></div>
        <div class="field" id="l-spec-wrap"><label for="l-spec">Specification</label><select id="l-spec"><option value="mid">Mid specification</option><option value="premium">Premium</option></select></div>
        <div class="field"><label for="l-gfa" id="l-gfa-label">Gross floor area (sq ft)</label><input id="l-gfa" type="number" inputmode="numeric" min="500" max="30000" step="50" value="3500"></div>
      </form>
      <div class="calc-result" id="l-result" aria-live="polite"></div>
    </div>
    <p class="muted small">Sources, reviewed ${esc(formatDate(LANDED_REVIEWED))}: ${LANDED_SOURCES.map(([l, u]) => `<a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(l)}</a>`).join(' · ')}. Indicative only; rely on your professionals' estimates.</p>
  </section>

  ${pros.map((p) => `
  <section class="wrap" id="${esc(p.slug)}">
    <h2>${esc(p.plural)}</h2>
    ${firmGrid(p.firms, p.slug, p.plural.toLowerCase())}
  </section>`).join('')}

  <section class="wrap prose-section" id="brief">
    <div class="grid grid-2">
      <div>${faqHtml(LANDED_FAQS)}</div>
      <div class="lead-form-section">
        <h2>Send a landed project brief</h2>
        <p class="section-sub">One brief, sent to up to two architects, two engineers and two builders listed on Layered. Free for homeowners.</p>
        <form class="panel wide" method="post" action="/leads">
          <input type="hidden" name="category" value="landed">
          <div class="two-col">
            <div class="field"><label for="lb-name">Your name</label><input id="lb-name" type="text" name="name" autocomplete="name" required></div>
            <div class="field"><label for="lb-email">Email</label><input id="lb-email" type="email" name="email" autocomplete="email" required></div>
          </div>
          <div class="two-col">
            <div class="field"><label for="lb-phone">Phone</label><input id="lb-phone" type="tel" name="phone" autocomplete="tel"></div>
            <div class="field"><label for="lb-location">Location / estate</label><input id="lb-location" type="text" name="location" placeholder="e.g. Serangoon Gardens"></div>
          </div>
          <div class="two-col">
            <div class="field"><label for="lb-scope">Scope</label><select id="lb-scope" name="scope"><option value="rebuild">Reconstruction / rebuild</option><option value="aa">Addition and alteration (A&amp;A)</option><option value="new">New erection</option></select></div>
            <div class="field"><label for="lb-house">House type</label><select id="lb-house" name="house_type">${Object.entries(C.rebuild).map(([k, r]) => `<option value="${k}">${esc(r.label)}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label for="lb-budget">Budget</label><select id="lb-budget" name="budget_range"><option value="">Not sure yet</option><option>Below $500k</option><option>$500k - $1M</option><option>$1M - $2M</option><option>Above $2M</option></select></div>
          <div class="field"><label for="lb-message">About your project</label><textarea id="lb-message" name="message" placeholder="Plot size, current house, what you want to change, target timeline"></textarea></div>
          <p class="muted small">Your phone number and email stay hidden from a firm until that firm unlocks your enquiry. If no firm unlocks it, we delete your contact details after 90 days. See our <a href="/privacy">privacy policy</a>.</p>
          <button class="btn btn-block" type="submit">Send my brief</button>
        </form>
      </div>
    </div>
    <div class="cta-box">
      <h2>Are you an architect, engineer or landed builder?</h2>
      <p>List your practice in Layered Landed and receive briefs from owners planning A&amp;A and rebuilds.</p>
      <p><a class="btn btn-sm" href="/signup?category=architect">List your practice</a></p>
    </div>
  </section>
  <script>
  var LC=${JSON.stringify(C)};
  ${landedEstimate.toString()}
  (function(){
    var $=function(id){return document.getElementById(id)};
    function fmt(n){return 'S$'+(Math.round(n/1000)*1000).toLocaleString('en-SG')}
    function render(){
      var aa=$('l-scope').value==='aa';
      $('l-type-wrap').hidden=aa;$('l-spec-wrap').hidden=aa;
      $('l-gfa-label').textContent=aa?'Area of the works (sq ft)':'Gross floor area (sq ft)';
      var r=landedEstimate({scope:$('l-scope').value,type:$('l-type').value,spec:$('l-spec').value,gfa:$('l-gfa').value},LC);
      if(!r.ok){$('l-result').innerHTML='<p class="calc-error">'+r.error+'</p>';return}
      $('l-result').innerHTML='<p class="calc-label">Estimated total, before interiors</p><p class="calc-big">'+fmt(r.total[0])+' – '+fmt(r.total[1])+'</p>'
        +'<ul class="est-summary"><li><span>Construction</span><span>'+fmt(r.build[0])+' – '+fmt(r.build[1])+'</span></li>'
        +'<li><span>Architect and engineer fees</span><span>'+fmt(r.fees[0])+' – '+fmt(r.fees[1])+'</span></li>'
        +'<li><span>'+(aa?'Submissions':'Demolition and submissions')+'</span><span>'+fmt(r.extras[0])+' – '+fmt(r.extras[1])+'</span></li></ul>'
        +'<p class="muted small">Indicative, from published 2026 rates. Excludes interiors, loose furniture and GST.</p>'
        +'<p class="calc-actions"><a class="btn" href="#brief">Send a project brief</a></p>';
    }
    // A&A usually covers part of the house, so start it from a smaller area.
    $('l-scope').addEventListener('change',function(){var g=$('l-gfa');if($('l-scope').value==='aa'&&g.value==='3500')g.value='1200';else if($('l-scope').value==='rebuild'&&g.value==='1200')g.value='3500'});
    $('landed-calc').addEventListener('input',render);$('landed-calc').addEventListener('change',render);render();
  })();
  </script>`;

  res.end(layout({
    title: 'Landed A&A and Rebuild in Singapore (2026)',
    description: 'Planning a landed A&A or rebuild in Singapore? 2026 costs per sq ft, URA and BCA approvals, timelines, and architects, engineers and builders in one place.',
    path, site: ctx.site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [breadcrumbSchema(ctx.site, crumbs), faqSchema(LANDED_FAQS)],
  }));
}
