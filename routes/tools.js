// routes/tools.js — interactive tools. Currently: the renovation cost calculator.
import { esc, layout } from '../lib/render.js';
import { abs, breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { DATA, DATA_REVIEWED, estimate, budgetBand } from '../content/estimator.js';

const money = (n) => `S$${Math.round(n).toLocaleString('en-SG')}`;
const range = ([a, b], open) => (b === null ? `from ${money(a)}` : `${money(a)} - ${money(b)}${open ? '+' : ''}`);

const FAQS = [
  { q: 'How accurate is a renovation cost calculator?', a: 'It gives a realistic range, not a quote. The calculator uses the ranges Singapore renovation guides published in 2026 for standard scopes. Your actual cost depends on your layout, the condition of the home, the amount of custom carpentry and the finishes you choose, so always compare itemised quotes.' },
  { q: 'Why does the calculator add a buffer?', a: 'Renovations rarely finish exactly on budget, especially in older resale homes where hidden problems appear once finishes come off. A contingency of about 10% to 15% is commonly recommended, so the calculator shows a suggested budget that includes it.' },
  { q: 'Does the estimate include furniture and appliances?', a: 'No. The ranges cover renovation works. Loose furniture, most appliances, curtains and moving costs are usually separate, and for offices, IT and end-of-lease reinstatement are also commonly separate.' },
  { q: 'Why do some ranges say "and above"?', a: 'For premium specifications the published guides give a starting price but no ceiling, because high-end finishes can cost far more. In those cases the calculator treats the top figure as a minimum for the top of the range.' },
  { q: 'Where do the figures come from?', a: 'They are the ranges quoted by Singapore renovation guides in 2026, collected in the same cost articles on this site. They are indicative and are reviewed regularly. Your own quotes always take priority.' },
];

const tableRows = (rows) => rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<td><strong>${esc(c)}</strong></td>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('');
const table = (head, rows) => `<div class="table-scroll"><table class="data-table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${tableRows(rows)}</tbody></table></div>`;

function staticTables() {
  const hdbRows = Object.values(DATA.hdb).map((f) => [f.label, range(f.bto), range(f.resale)]);
  const specRows = Object.values(DATA.hdbSpec4Room).map((s, i, a) => [s.label, range(s.bto, i === a.length - 1), range(s.resale, i === a.length - 1)]);
  const condoRows = Object.values(DATA.condo).map((c) => [c.label, range(c.psf) + ' per sq ft']);
  const kitchenRows = Object.values(DATA.kitchen).map((k, i, a) => [k.label, range(k.range, i === a.length - 1)]);
  const bathRows = Object.values(DATA.bathroom).map((b) => [b.label, range(b.range)]);
  const officeRows = Object.values(DATA.office).map((o) => [o.label, `${range(o.psf)} per sq ft`]);
  return `
    <h3>HDB flats (standard specification)</h3>${table(['Flat', 'BTO', 'Resale'], hdbRows)}
    <h3>4-room HDB by specification</h3>${table(['Specification', 'BTO', 'Resale'], specRows)}
    <h3>Condominiums</h3>${table(['Scope', 'Range'], condoRows)}
    <h3>Kitchen</h3>${table(['Scope', 'Range'], kitchenRows)}
    <h3>Bathroom (each)</h3>${table(['Scope', 'Range'], bathRows)}
    <h3>Office fit-out</h3>${table(['Specification', 'Range'], officeRows)}`;
}

const opts = (obj, selected) => Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}"${k === selected ? ' selected' : ''}>${esc(v.label)}</option>`).join('');

export async function calculatorRoute(req, res, ctx) {
  const site = ctx.site;
  const path = '/tools/renovation-cost-calculator';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Renovation cost calculator', path }];

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <span class="eyebrow">Free tool</span>
    <h1>Renovation cost calculator for Singapore</h1>
    <p class="section-sub">Estimate what your renovation could cost: a whole HDB flat, a condo, just the kitchen and bathrooms, or an office fit-out. Based on the ranges Singapore renovation guides published in 2026. It is an estimate to plan with, not a quote.</p>
  </section>

  <section class="wrap calc-section">
    <div class="calc" id="calc">
      <div class="calc-tabs" role="radiogroup" aria-label="What are you renovating?">
        <label><input type="radio" name="mode" value="hdb" checked><span>HDB flat</span></label>
        <label><input type="radio" name="mode" value="condo"><span>Condo</span></label>
        <label><input type="radio" name="mode" value="rooms"><span>Kitchen &amp; bathrooms</span></label>
        <label><input type="radio" name="mode" value="office"><span>Office</span></label>
      </div>

      <div class="calc-body">
        <form class="calc-form" onsubmit="return false" novalidate>
          <div class="calc-fields" data-mode="hdb">
            <div class="field"><label for="c-flat">Flat type</label><select id="c-flat">${opts(DATA.hdb, '4-room')}</select></div>
            <div class="field"><label for="c-cond">Is it new (BTO) or resale?</label><select id="c-cond"><option value="bto">New BTO flat</option><option value="resale">Resale flat</option></select></div>
            <div class="field" id="c-spec-wrap"><label for="c-spec">Specification</label><select id="c-spec">${opts(DATA.hdbSpec4Room, 'standard')}</select><p class="hint">Published ranges by specification are available for 4-room flats.</p></div>
          </div>

          <div class="calc-fields" data-mode="condo" hidden>
            <div class="field"><label for="c-carea">Floor area (square feet)</label><input id="c-carea" type="number" inputmode="numeric" min="200" max="10000" step="10" value="900"></div>
            <div class="field"><label for="c-ctier">Scope</label><select id="c-ctier">${opts(DATA.condo, 'full')}</select></div>
          </div>

          <div class="calc-fields" data-mode="rooms" hidden>
            <div class="field"><label for="c-kitchen">Kitchen</label><select id="c-kitchen"><option value="none">No kitchen works</option>${opts(DATA.kitchen, 'standard')}</select></div>
            <div class="field"><label for="c-bcount">Number of bathrooms</label><select id="c-bcount">${[0, 1, 2, 3, 4].map((n) => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
            <div class="field"><label for="c-bscope">Bathroom scope</label><select id="c-bscope">${opts(DATA.bathroom, 'rebuild')}</select></div>
          </div>

          <div class="calc-fields" data-mode="office" hidden>
            <div class="field"><label for="c-oarea">Office area (square feet)</label><input id="c-oarea" type="number" inputmode="numeric" min="200" max="100000" step="50" value="1500"></div>
            <div class="field"><label for="c-otier">Specification</label><select id="c-otier">${opts(DATA.office, 'mid')}</select></div>
          </div>
        </form>

        <div class="calc-result" id="calc-result" aria-live="polite">
          <p class="muted">Choose your options to see an estimate.</p>
        </div>
      </div>
    </div>
    <noscript><p class="muted">The calculator needs JavaScript. The full tables of ranges are below, so you can work out an estimate by hand.</p></noscript>
  </section>

  <section class="wrap prose-section">
    <h2>How this calculator works</h2>
    <div class="prose">
      <p>The calculator looks up the range for the option you choose and adds a <strong>10% to 15% contingency</strong> to show a suggested budget. Condo and office figures are multiplied by your floor area. Everything is based on ranges that Singapore renovation guides published in 2026, reviewed on ${esc(formatDate(DATA_REVIEWED))}.</p>
      <p>It does not know your layout, your finishes or the condition of your home. Use it to set a realistic budget before you talk to designers, then compare <a href="/blog/renovation-contract-singapore-what-to-check">itemised quotes</a> to see what is really included.</p>
    </div>

    <h2>All the ranges in one place</h2>
    <p class="muted">These are the same figures the calculator uses. Ranges marked "+" have no published ceiling.</p>
    ${staticTables()}

    ${faqHtml(FAQS)}

    <div class="cta-box">
      <h2>Turn your estimate into quotes</h2>
      <p>Compare Singapore interior designers and renovation firms, check their HDB licence and CaseTrust credentials, then get matched for free.</p>
      <p><a class="btn btn-sm" href="/designers">Browse designers</a> <a class="btn btn-sm btn-outline" href="/guides/renovation-checklist-singapore">Renovation checklist</a></p>
    </div>

    <section class="related"><h2>Read the detail behind the numbers</h2><ul>
      <li><a href="/guides/hdb-renovation-cost-singapore">HDB renovation cost guide</a></li>
      <li><a href="/blog/3-room-hdb-renovation-cost-singapore">3-room</a> and <a href="/blog/4-room-vs-5-room-hdb-renovation-cost">4-room vs 5-room</a> costs</li>
      <li><a href="/guides/condo-renovation-cost-and-rules">Condo renovation cost and rules</a></li>
      <li><a href="/blog/hdb-kitchen-renovation-cost-singapore">Kitchen</a> and <a href="/blog/hdb-bathroom-renovation-cost-singapore">bathroom</a> costs</li>
      <li><a href="/blog/office-renovation-cost-singapore">Office renovation cost</a></li>
      <li><a href="/blog/renovation-loan-singapore-how-it-works">How a renovation loan works</a></li>
    </ul></section>
  </section>
  <script>${CALC_JS()}</script>`;

  res.end(layout({
    title: 'Renovation Cost Calculator Singapore (2026)',
    description: 'Estimate your renovation cost in Singapore: HDB BTO and resale, condo per square foot, kitchen and bathrooms, or an office fit-out. Based on 2026 price ranges.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [
      breadcrumbSchema(site, crumbs),
      faqSchema(FAQS),
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Renovation cost calculator', url: abs(site, path), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'en-SG', offers: { '@type': 'Offer', price: '0', priceCurrency: 'SGD' } },
    ],
  }));
}

// Runs in the browser. `estimate` and `budgetBand` are the same functions the tests exercise.
function CALC_JS() {
  return `
var D=${JSON.stringify(DATA)};
${estimate.toString()}
${budgetBand.toString()}
(function(){
  var $=function(id){return document.getElementById(id)};
  var root=$('calc'), result=$('calc-result');
  var LINKS={hdb:[['/guides/hdb-renovation-cost-singapore','HDB renovation cost guide'],['/blog/resale-hdb-renovation-hidden-costs','Resale hidden costs']],condo:[['/guides/condo-renovation-cost-and-rules','Condo cost and rules guide'],['/blog/condo-renovation-approval-singapore','Condo approval steps']],rooms:[['/blog/hdb-kitchen-renovation-cost-singapore','Kitchen cost guide'],['/blog/hdb-bathroom-renovation-cost-singapore','Bathroom cost guide']],office:[['/blog/office-renovation-cost-singapore','Office cost guide']]};
  function fmt(n){return 'S$'+(Math.round(n/100)*100).toLocaleString('en-SG')}
  function mode(){return root.querySelector('input[name=mode]:checked').value}
  function read(){
    var m=mode();
    if(m==='hdb') return {mode:'hdb',flat:$('c-flat').value,condition:$('c-cond').value,spec:$('c-spec').value};
    if(m==='condo') return {mode:'condo',area:$('c-carea').value,tier:$('c-ctier').value};
    if(m==='rooms') return {mode:'rooms',kitchen:$('c-kitchen').value,bathrooms:$('c-bcount').value,bathScope:$('c-bscope').value};
    return {mode:'office',area:$('c-oarea').value,tier:$('c-otier').value};
  }
  function render(){
    var m=mode();
    [].forEach.call(root.querySelectorAll('.calc-fields'),function(f){f.hidden=f.getAttribute('data-mode')!==m});
    $('c-spec-wrap').style.display=($('c-flat').value==='4-room')?'':'none';
    $('c-bscope').disabled=($('c-bcount').value==='0');
    var r=estimate(read(),D);
    if(!r.ok){result.innerHTML='<p class="calc-error">'+r.error+'</p>';return}
    var single=r.low===r.high;
    var rangeTxt=single?('from '+fmt(r.low)):(fmt(r.low)+' – '+fmt(r.high)+(r.openEnded?'+':''));
    var sugTxt=single?('from '+fmt(r.suggestedLow)):(fmt(r.suggestedLow)+' – '+fmt(r.suggestedHigh)+(r.openEnded?'+':''));
    var mid=single?r.suggestedLow:(r.suggestedLow+r.suggestedHigh)/2;
    var cta='/?type='+encodeURIComponent(r.propertyType||'')+'&budget='+encodeURIComponent(budgetBand(mid))+'#get-recommendations';
    if(!r.propertyType) cta='/?budget='+encodeURIComponent(budgetBand(mid))+'#get-recommendations';
    result.innerHTML='<p class="calc-label">Estimated renovation cost</p><p class="calc-big">'+rangeTxt+'</p>'
      +'<p class="calc-label">Suggested budget with a 10–15% buffer</p><p class="calc-sub">'+sugTxt+'</p>'
      +'<ul class="calc-notes">'+r.notes.map(function(n){return '<li>'+n+'</li>'}).join('')+'</ul>'
      +'<p class="calc-actions"><a class="btn" href="'+cta+'">Get matched with designers</a></p>'
      +'<p class="muted small">Read more: '+LINKS[m].map(function(l){return '<a href="'+l[0]+'">'+l[1]+'</a>'}).join(' · ')+'</p>'
      +'<p class="muted small">An indicative estimate from published 2026 ranges, not a quote.</p>';
  }
  root.addEventListener('input',render); root.addEventListener('change',render); render();
})();`;
}
