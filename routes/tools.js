// routes/tools.js — interactive tools: the renovation cost calculator, the itemised cost estimator and the room planner.
import { esc, layout } from '../lib/render.js';
import { abs, breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { DATA, DATA_REVIEWED, estimate, budgetBand } from '../content/estimator.js';
import { ROOM_TYPES, CATALOG, LAYOUTS, WALL, planQuantities } from '../content/planner.js';
import { HOMES, ITEMS, PRESETS, CONTINGENCY, GST, SOURCES, ITEMS_REVIEWED, itemisedEstimate } from '../content/itemised.js';

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
      <li><a href="/tools/renovation-cost-estimator">Itemised renovation cost estimator</a>: price item by item</li>
      <li><a href="/tools/room-planner">Room planner</a>: draw your layout and price it</li>
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

// ----- /tools/renovation-cost-estimator -----
const EST_FAQS = [
  { q: 'How is the itemised estimate worked out?', a: 'Each line multiplies your quantity by a low and high unit rate (per square foot, per foot run, per point or per item) published by Singapore contractors and cost guides in 2026. The lines are added up, and a 10% to 15% contingency is shown on top.' },
  { q: 'Why is my itemised total lower than a firm\'s package price?', a: 'The estimate covers the works only. A firm\'s quote also includes design, project management, supervision, overheads and often GST, and it may include items you have not listed. Use the itemised total to understand where the money goes, and the whole-home calculator for a typical all-in range.' },
  { q: 'What is a foot run?', a: 'Carpentry is usually priced per foot run: the length of the unit measured along the wall, in feet. A 6-foot-wide wardrobe is 6 foot run, whatever its height. Kitchen top and bottom cabinets are counted separately.' },
  { q: 'Are the typical quantities right for my home?', a: 'They are a starting point we chose for a common scope, not measurements of your home. Change any quantity, set an item to zero to remove it, and ask your designer to measure on site.' },
  { q: 'Does it include GST?', a: 'Not by default. GST-registered firms charge 9% GST, and you can tick the box to add it.' },
];

const rateText = (it) => {
  if (it.rangeBy) return 'Depends on home size';
  const f = (n) => `S$${n.toLocaleString('en-SG', { maximumFractionDigits: 1 })}`;
  return `${f(it.range[0])} – ${f(it.range[1])} per ${it.unit}`;
};

export async function estimatorRoute(req, res, ctx) {
  const site = ctx.site;
  const path = '/tools/renovation-cost-estimator';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Renovation cost estimator', path }];
  const homeOpts = Object.entries(HOMES).map(([k, v]) => `<option value="${k}"${k === 'hdb4' ? ' selected' : ''}>${esc(v.label)}</option>`).join('');
  const groups = ITEMS.map((g) => `
    <tbody>
      <tr class="est-group"><th colspan="3" scope="colgroup">${esc(g.group)}</th></tr>
      ${g.items.map((it) => `<tr>
        <td><label for="q-${it.key}">${esc(it.label)}</label><span class="est-rate" data-rate="${it.key}">${esc(rateText(it))}</span></td>
        <td class="est-qty"><input id="q-${it.key}" data-key="${it.key}" type="number" inputmode="decimal" min="0" step="1" value="0" aria-describedby="u-${it.key}"> <span class="muted small" id="u-${it.key}">${esc(it.unit)}</span></td>
        <td class="est-line" data-line="${it.key}">–</td>
      </tr>`).join('')}
    </tbody>`).join('');
  const rateRows = ITEMS.flatMap((g) => g.items.map((it) => [g.group, it.label, it.rangeBy
    ? Object.entries(it.rangeBy).map(([h, r]) => `${HOMES[h].label}: ${range(r)}`).join('; ')
    : rateText(it)]));

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <span class="eyebrow">Free tool</span>
    <h1>Itemised renovation cost estimator</h1>
    <p class="section-sub">Price your renovation item by item, the way a quotation is written: flooring per square foot, carpentry per foot run, electrical points, bathrooms and more. Unit rates are from Singapore contractors and cost guides published in 2026. It is an estimate to plan with, not a quote.</p>
  </section>

  <section class="wrap calc-section">
    <div class="calc est" id="est">
      <form class="est-setup" onsubmit="return false" novalidate>
        <div class="field"><label for="e-home">Type of home</label><select id="e-home">${homeOpts}</select></div>
        <div class="field"><label for="e-cond">New or resale?</label><select id="e-cond"><option value="bto">New (BTO or new condo)</option><option value="resale">Resale</option></select></div>
        <div class="field est-buttons"><button type="button" class="btn btn-sm" id="e-preset">Fill in a typical scope</button> <button type="button" class="btn btn-sm btn-outline" id="e-clear">Clear all</button></div>
      </form>
      <p class="est-fromplan" id="e-fromplan" hidden>Quantities filled in from your <a href="/tools/room-planner">room plan</a>. Add bathroom works, electrical points and painting to complete the picture.</p>
      <div class="est-body">
        <div class="table-scroll"><table class="data-table est-table">
          <thead><tr><th scope="col">Item and unit rate</th><th scope="col">Quantity</th><th scope="col">Estimate</th></tr></thead>
          ${groups}
        </table></div>
        <aside class="calc-result est-result" id="est-result" aria-live="polite"><p class="muted">Fill in a typical scope or enter quantities to see an estimate.</p></aside>
        <a class="est-mini" id="est-mini" href="#est-result" hidden></a>
      </div>
    </div>
    <noscript><p class="muted">The estimator needs JavaScript. All the unit rates are listed below, so you can work out an estimate by hand.</p></noscript>
  </section>

  <section class="wrap prose-section">
    <h2>How the estimator works</h2>
    <div class="prose">
      <p>Each line multiplies your quantity by a low and a high unit rate, and the lines are added up. A <strong>10% to 15% contingency</strong> is shown on top, and you can add 9% GST. Rates were collected from published Singapore price guides and reviewed on ${esc(formatDate(ITEMS_REVIEWED))}.</p>
      <p>Want the quantities worked out for you? Draw your home in the <a href="/tools/room-planner">room planner</a> and send it here in one click.</p>
      <p>The total covers the <strong>works only</strong>. Firms also charge for design, project management and supervision, so package quotes are usually higher. For a typical all-in range by home type, use the <a href="/tools/renovation-cost-calculator">renovation cost calculator</a>. Then compare <a href="/blog/how-to-read-a-renovation-quotation-singapore">itemised quotations</a> from two or three firms.</p>
    </div>

    <h2>All unit rates</h2>
    ${table(['Category', 'Item', 'Rate'], rateRows)}

    <h2>Where the rates come from</h2>
    <ul class="sources">${SOURCES.map(([l, u]) => `<li>${esc(l)}: <a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(new URL(u).hostname.replace(/^www\./, ''))}</a></li>`).join('')}</ul>
    <p class="muted small">Typical quantities are our own assumptions for a common scope. Prices change, so treat every figure as indicative and rely on written quotes.</p>

    ${faqHtml(EST_FAQS)}

    <div class="cta-box">
      <h2>Turn your estimate into quotes</h2>
      <p>Compare Singapore interior designers, check their HDB licence and CaseTrust credentials, then get matched for free.</p>
      <p><a class="btn btn-sm" href="/designers">Browse designers</a> <a class="btn btn-sm btn-outline" href="/guides/renovation-checklist-singapore">Renovation checklist</a></p>
    </div>
  </section>
  <script>${EST_JS()}</script>`;

  res.end(layout({
    title: 'Itemised Renovation Cost Estimator Singapore',
    description: 'Estimate your Singapore renovation item by item: flooring per sq ft, carpentry per foot run, bathrooms, electrical points and painting, using 2026 unit rates.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [
      breadcrumbSchema(site, crumbs),
      faqSchema(EST_FAQS),
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Itemised renovation cost estimator', url: abs(site, path), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'en-SG', offers: { '@type': 'Offer', price: '0', priceCurrency: 'SGD' } },
    ],
  }));
}

function EST_JS() {
  return `
var ITEMS=${JSON.stringify(ITEMS)}, PRESETS=${JSON.stringify(PRESETS)}, CONTINGENCY=${JSON.stringify(CONTINGENCY)}, GST=${GST}, HOMES=${JSON.stringify(HOMES)};
${itemisedEstimate.toString()}
${budgetBand.toString()}
(function(){
  var $=function(id){return document.getElementById(id)};
  var root=$('est'), out=$('est-result'), gst=false;
  var inputs=[].slice.call(root.querySelectorAll('input[data-key]'));
  function fmt(n){return 'S$'+(Math.round(n/10)*10).toLocaleString('en-SG')}
  function money(n){return 'S$'+n.toLocaleString('en-SG',{maximumFractionDigits:1})}
  function find(k){for(var g=0;g<ITEMS.length;g++)for(var i=0;i<ITEMS[g].items.length;i++)if(ITEMS[g].items[i].key===k)return ITEMS[g].items[i]}
  function render(){
    var home=$('e-home').value, qty={};
    inputs.forEach(function(el){qty[el.getAttribute('data-key')]=el.value});
    [].forEach.call(root.querySelectorAll('[data-rate]'),function(el){var it=find(el.getAttribute('data-rate'));if(it.rangeBy){var r=it.rangeBy[home];el.textContent=r?money(r[0])+' – '+money(r[1])+' per '+it.unit:'Ask for a quote for this home type'}});
    [].forEach.call(root.querySelectorAll('[data-line]'),function(el){el.textContent='–'});
    var r=itemisedEstimate({home:home,qty:qty},ITEMS,CONTINGENCY);
    var mini=$('est-mini');
    if(!r.ok){out.innerHTML='<p class="calc-error">'+r.error+'</p>';mini.hidden=true;return}
    r.lines.forEach(function(l){var c=root.querySelector('[data-line="'+l.key+'"]');if(c)c.textContent=fmt(l.low)+' – '+fmt(l.high)});
    var m=gst?1+GST:1, lo=r.low*m, hi=r.high*m, sl=r.suggestedLow*m, sh=r.suggestedHigh*m;
    var groups={};r.lines.forEach(function(l){groups[l.group]=groups[l.group]||[0,0];groups[l.group][0]+=l.low*m;groups[l.group][1]+=l.high*m});
    var type=home==='condo'?'Condo':'HDB';
    var cta='/?type='+type+'&budget='+encodeURIComponent(budgetBand((sl+sh)/2))+'#get-recommendations';
    out.innerHTML='<p class="calc-label">Estimated cost of the works'+(gst?' incl. GST':'')+'</p><p class="calc-big">'+fmt(lo)+' – '+fmt(hi)+'</p>'
      +'<p class="calc-label">Suggested budget with a 10–15% buffer</p><p class="calc-sub">'+fmt(sl)+' – '+fmt(sh)+'</p>'
      +'<label class="est-gst"><input type="checkbox" id="e-gst"'+(gst?' checked':'')+'> Add 9% GST</label>'
      +'<ul class="est-summary">'+Object.keys(groups).map(function(g){return '<li><span>'+g+'</span><span>'+fmt(groups[g][0])+' – '+fmt(groups[g][1])+'</span></li>'}).join('')+'</ul>'
      +(r.skipped.length?'<p class="muted small">Not priced for this home type: '+r.skipped.join(', ')+'.</p>':'')
      +'<p class="muted small">Works only. Design, project management and supervision are usually extra.</p>'
      +'<p class="calc-actions"><a class="btn" href="'+cta+'">Get matched with designers</a></p>';
    mini.hidden=false;mini.innerHTML='<span>Estimate'+(gst?' incl. GST':'')+'</span><strong>'+fmt(lo)+' – '+fmt(hi)+'</strong>';
    $('e-gst').addEventListener('change',function(e){gst=e.target.checked;render()});
  }
  function preset(){var p=PRESETS[$('e-cond').value][$('e-home').value]||{};inputs.forEach(function(el){el.value=p[el.getAttribute('data-key')]||0});render()}
  $('e-preset').addEventListener('click',preset);
  $('e-clear').addEventListener('click',function(){inputs.forEach(function(el){el.value=0});render()});
  root.addEventListener('input',function(e){if(e.target.id!=='e-gst')render()});
  $('e-home').addEventListener('change',render);
  var h=new URLSearchParams(location.hash.slice(1)), fromPlan=h.get('q');
  if(fromPlan){
    if(HOMES[h.get('home')]) $('e-home').value=h.get('home');
    var got={};fromPlan.split(',').forEach(function(p){var kv=p.split(':');var v=Number(kv[1]);if(kv[0]&&v>0&&v<100000)got[kv[0]]=v});
    inputs.forEach(function(el){el.value=got[el.getAttribute('data-key')]||0});
    var n=$('e-fromplan');if(n)n.hidden=false;
    render();
  } else preset();
})();`;
}

// ----- /tools/room-planner -----
const PLAN_FAQS = [
  { q: 'Is the room planner free?', a: 'Yes. It runs in your browser and your plan is saved on this device only. Nothing is uploaded unless you choose to send a summary with an enquiry.' },
  { q: 'Are the starter layouts real HDB floor plans?', a: 'No. They are our own approximate arrangements of a typical flat of each type, to save you drawing from scratch. Change the room sizes to match your own floor plan, or trace over a picture of it.' },
  { q: 'How do I trace my own floor plan?', a: 'Use "Trace a floor plan" to show a photo or screenshot of your plan behind the drawing, set its width in metres so it is to scale, then move and resize the rooms over it. The picture stays on your device.' },
  { q: 'How are the quantities worked out?', a: 'Flooring is the area of the dry rooms (living, bedrooms, study) in square feet. Carpentry is the length of each built-in in feet, which is how Singapore carpentry is usually priced (per foot run). Platform beds are counted per bed.' },
  { q: 'Can a designer use my plan?', a: 'Yes. Download it as an image or print it, and send the summary with an enquiry so firms see your layout and built-ins before they quote.' },
];

const PLAN_SVG_CSS = 'text{font-family:system-ui,sans-serif;font-size:.26px;fill:#15291f}.pl-dim{font-size:.2px;fill:#566c65}.pl-room rect{fill:#fbfdfb;stroke:#15291f;stroke-width:.15}.pl-gap{fill:#fff}.pl-hit{fill:transparent}.pl-grab{stroke:none}.pl-leaf{stroke:#15291f;stroke-width:.04}.pl-main{stroke-width:.07}.pl-swing{fill:none;stroke:#566c65;stroke-width:.02;stroke-dasharray:.06 .04}.pl-win{fill:#fff;stroke:#15291f;stroke-width:.025}.pl-glass{stroke:#4a90b8;stroke-width:.03}.pl-panel{stroke:#15291f;stroke-width:.035}.pl-bathroom rect,.pl-kitchen rect,.pl-yard rect{fill:#e8eef0}.pl-item rect{fill:#fff;stroke:#566c65;stroke-width:.025}.pl-item.is-built rect{fill:#f9dd8f;stroke:#a87400}.pl-item.is-wall rect{fill:none;stroke-dasharray:.08 .05}.pl-itemlabel{font-size:.16px}.pl-gridline{stroke:#d3ddd7;stroke-width:.01}';

export async function plannerRoute(req, res, ctx) {
  const site = ctx.site;
  const path = '/tools/room-planner';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Room planner', path }];
  const qtyLabels = {};
  ITEMS.forEach((g) => g.items.forEach((it) => { qtyLabels[it.key] = it.label; }));
  const builtIns = Object.entries(CATALOG).filter(([, c]) => c.built);
  const loose = Object.entries(CATALOG).filter(([, c]) => !c.built && !c.opening);
  const openings = Object.entries(CATALOG).filter(([, c]) => c.opening);
  const addBtns = (list) => list.map(([k, c]) => `<button type="button" class="pl-add" data-add="${k}">${esc(c.label)}</button>`).join('');
  const layoutOpts = Object.entries(LAYOUTS).map(([k, l]) => `<option value="${k}"${k === 'hdb4' ? ' selected' : ''}>${esc(l.label)}</option>`).join('');
  const data = { roomTypes: ROOM_TYPES, catalog: CATALOG, layouts: LAYOUTS, qtyLabels, wall: WALL, svgCss: PLAN_SVG_CSS };

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <span class="eyebrow">Free tool</span>
    <h1>Room planner: draw your home and price it</h1>
    <p class="section-sub">Lay out your rooms to scale, place wardrobes, kitchen cabinets and other built-ins, and see the flooring area and carpentry foot runs worked out for you. Then price the plan in one click, or send it to designers with your enquiry.</p>
  </section>

  <section class="wrap calc-section">
    <div class="calc planner" id="planner">
      <div class="pl-toolbar">
        <div class="field"><label for="pl-home">Starting layout</label><select id="pl-home">${layoutOpts}</select></div>
        <button type="button" class="btn btn-sm" id="pl-load">Use this layout</button>
        <button type="button" class="btn btn-sm btn-outline" id="pl-addroom">Add a room</button>
        <span class="pl-zoom"><button type="button" class="btn btn-sm btn-outline" id="pl-zout" aria-label="Zoom out">−</button><button type="button" class="btn btn-sm btn-outline" id="pl-zin" aria-label="Zoom in">+</button><button type="button" class="btn btn-sm btn-outline" id="pl-fit">Fit</button></span>
      </div>
      <div class="pl-body">
        <div class="pl-canvas">
          <svg id="pl-svg" role="img" aria-label="Floor plan drawing" xmlns="http://www.w3.org/2000/svg"></svg>
          <p class="muted small">Drag rooms and items to move them, drag the corner square to resize, drag empty space to pan. Doors and windows snap onto the nearest wall. Arrow keys nudge the selection; Delete removes it.</p>
        </div>
        <aside class="pl-side">
          <h2 class="pl-h">Selected</h2>
          <div id="pl-panel"></div>
          <h2 class="pl-h">Add doors &amp; windows <span class="muted small">(snap to walls)</span></h2>
          <div class="pl-adds">${addBtns(openings)}</div>
          <h2 class="pl-h">Add built-ins <span class="muted small">(priced)</span></h2>
          <div class="pl-adds">${addBtns(builtIns)}</div>
          <h2 class="pl-h">Add furniture <span class="muted small">(for layout only)</span></h2>
          <div class="pl-adds">${addBtns(loose)}</div>
          <h2 class="pl-h">Your plan</h2>
          <div id="pl-summary"></div>
          <p class="pl-cta"><a class="btn" id="pl-price" href="/tools/renovation-cost-estimator">Price this plan</a> <a class="btn btn-outline" id="pl-enquire" href="/#get-recommendations">Send to designers</a></p>
          <p class="pl-actions"><button type="button" class="btn btn-sm btn-outline" id="pl-download">Download image</button> <button type="button" class="btn btn-sm btn-outline" id="pl-print">Print</button></p>
          <details class="pl-trace">
            <summary>Trace a floor plan</summary>
            <div class="field"><label for="pl-bg">Picture of your floor plan</label><input id="pl-bg" type="file" accept="image/*"></div>
            <div id="pl-bgopts" hidden>
              <div class="field"><label for="pl-bgw">Width of the picture in metres</label><input id="pl-bgw" type="number" min="2" max="60" step="0.1" value="10"></div>
              <div class="field"><label for="pl-bgo">Transparency</label><input id="pl-bgo" type="range" min="0.1" max="1" step="0.05" value="0.5"></div>
              <button type="button" class="btn btn-sm btn-outline" id="pl-bgclear">Remove picture</button>
            </div>
            <p class="muted small">The picture stays on your device and is not uploaded.</p>
          </details>
        </aside>
      </div>
    </div>
    <noscript><p class="muted">The room planner needs JavaScript.</p></noscript>
  </section>

  <section class="wrap prose-section">
    <h2>How to use the room planner</h2>
    <div class="prose">
      <ol>
        <li><strong>Start from a typical layout</strong> for a 3-, 4- or 5-room HDB flat or a condo, or a blank plan. The layouts are approximate, so adjust the room sizes to match your floor plan, or trace over a picture of it.</li>
        <li><strong>Add doors and windows</strong>. The starter layouts include them; drag one near a wall and it snaps into place. Use "Swing other side" and "Flip hinge" to set which way a door opens.</li>
        <li><strong>Place your built-ins</strong>: wardrobes, kitchen cabinets, TV console, shoe cabinet, study table and platform beds. Set each one's width to the length you want.</li>
        <li><strong>Check the summary</strong>: dry floor area for flooring and the foot runs of carpentry, the units Singapore firms quote in.</li>
        <li><strong>Price it</strong> in the <a href="/tools/renovation-cost-estimator">itemised cost estimator</a>, then add bathrooms, electrical and painting. For a quick all-in range, see the <a href="/tools/renovation-cost-calculator">cost calculator</a>.</li>
        <li><strong>Send it to designers</strong> with your enquiry, or download and print it to bring to meetings.</li>
      </ol>
      <p>Your plan is saved in this browser only. Check HDB's rules before planning to remove walls: see our <a href="/guides/hdb-renovation-permit-and-rules">HDB renovation permit and rules guide</a>.</p>
    </div>
    ${faqHtml(PLAN_FAQS)}
  </section>
  <script>window.PLANNER=${JSON.stringify(data).replace(/</g, '\\u003c')};${planQuantities.toString()}</script>
  <script src="/planner.js" defer></script>`;

  res.end(layout({
    title: 'Room Planner: Draw Your Floor Plan and Price It',
    description: 'Free room planner for Singapore homes: draw your HDB or condo layout to scale, place built-in carpentry, and price flooring and foot runs in one click.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [
      breadcrumbSchema(site, crumbs),
      faqSchema(PLAN_FAQS),
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Room planner', url: abs(site, path), applicationCategory: 'DesignApplication', operatingSystem: 'Any', inLanguage: 'en-SG', offers: { '@type': 'Offer', price: '0', priceCurrency: 'SGD' } },
    ],
  }));
}
