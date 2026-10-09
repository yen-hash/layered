// routes/resources.js — /resources (downloads hub) and /tools/design-style-quiz.
import { esc, layout } from '../lib/render.js';
import { breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { STYLE_PAGES } from '../content/landing.js';
import { RESOURCES, RESOURCES_REVIEWED, QUIZ } from '../content/resources.js';
import { BUDGET_CATEGORIES, OUTSIDE_ITEMS, BUDGET_GST, budgetSummary } from '../content/budgetPlanner.js';
import { abs } from '../lib/seo.js';

const RES_FAQS = [
  { q: 'Are the downloads free?', a: 'Yes. There is no sign-up and no email needed. You can print them, share them with your family and edit the spreadsheet for your own home.' },
  { q: 'Is the contract checklist the CaseTrust standard contract?', a: 'No. It is a plain-language checklist of what a renovation contract should cover, with sample wording to compare against your own contract. For CaseTrust accreditation and any standard contract the Consumers Association of Singapore (CASE) publishes, check the CASE website. It is general information, not legal advice.' },
  { q: 'Are the cost figures in the planner quotes?', a: 'No. The planner has no prices in it except a 9% GST field you can change. Fill in your own quotes. For indicative ranges, use our cost calculator and itemised estimator.' },
  { q: 'Can I edit the budget planner?', a: 'Yes. It is an ordinary spreadsheet with simple formulas. Add or rename categories, and change the buffer and GST percentages to suit your home.' },
];

export async function resourcesRoute(req, res, ctx) {
  const site = ctx.site;
  const path = '/resources';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Free resources', path }];
  const cards = RESOURCES.map((r) => {
    const main = r.file
      ? `<a class="btn" href="${esc(r.file)}" download>${esc(r.label)}</a>`
      : `<a class="btn" href="${esc(r.href)}">${esc(r.label)}</a>`;
    const also = r.also.length ? `<p class="muted small">Also: ${r.also.map(([h, t]) => `<a href="${esc(h)}">${esc(t)}</a>`).join(' · ')}</p>` : '';
    return `<article class="card"><div class="body"><span class="eyebrow">${esc(r.type)}</span><h2>${esc(r.title)}</h2><p>${esc(r.summary)}</p><p>${main}</p>${also}</div></article>`;
  }).join('');
  const body = `
  <section class="wrap" style="padding-top:36px;padding-bottom:8px;">
    ${breadcrumbNav(crumbs)}
    <h1>Free renovation resources for Singapore homeowners</h1>
    <p class="lead">Download a budget planner, a printable checklist and a contract checklist, or take the design style quiz. No sign-up needed.</p>
    <div class="grid grid-2">${cards}</div>
    <p class="muted small" style="margin-top:18px;">Reviewed ${esc(formatDate(RESOURCES_REVIEWED))}. General information only: not legal, financial or professional advice. Rules and figures change, so check the official source before you rely on them. More free tools: <a href="/tools/renovation-cost-calculator">cost calculator</a>, <a href="/tools/renovation-cost-estimator">itemised estimator</a> and <a href="/tools/room-planner">room planner</a>.</p>
    ${faqHtml(RES_FAQS)}
  </section>`;
  res.end(layout({
    title: 'Free Renovation Resources: Budget Planner, Checklist, Contract Checklist',
    description: 'Free downloads for Singapore homeowners: an Excel renovation budget planner, a printable renovation checklist, a contract checklist with sample clauses, and a design style quiz.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [breadcrumbSchema(site, crumbs), faqSchema(RES_FAQS)],
  }));
}

// ----- /tools/design-style-quiz (server-scored: a GET form, no JavaScript needed) -----
const QUIZ_FAQS = [
  { q: 'What styles does the quiz cover?', a: 'Six popular Singapore home styles: minimalist, Scandinavian, industrial, modern, contemporary and classic. Most people are a blend, so the quiz also shows your second-closest style.' },
  { q: 'Is my answer saved or shared?', a: 'No. The quiz is scored when you submit it and nothing is stored or sent to any designer.' },
  { q: 'What do I do with the result?', a: 'Use it as a starting point for your brief. Save photos you like, then show your designer the style and what you like about it. See our guide to briefing a designer on the blog.' },
];

export function scoreQuiz(query) {
  const total = {};
  let answered = 0;
  QUIZ.forEach((q, i) => {
    const raw = query.get(`q${i + 1}`);
    const pick = raw === null || raw.trim() === '' ? NaN : Number(raw);
    if (Number.isInteger(pick) && pick >= 0 && pick < q.options.length) {
      answered += 1;
      Object.entries(q.options[pick][1]).forEach(([k, n]) => { total[k] = (total[k] || 0) + n; });
    }
  });
  const order = Object.keys(STYLE_PAGES);
  const ranked = order.map((k) => [k, total[k] || 0]).sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]));
  return { answered, ranked };
}

export async function quizRoute(req, res, ctx, url) {
  const site = ctx.site;
  const path = '/tools/design-style-quiz';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Free resources', path: '/resources' }, { name: 'Design style quiz', path }];
  const { answered, ranked } = scoreQuiz(url.searchParams);
  const done = answered === QUIZ.length;
  const picked = (i) => (url.searchParams.get(`q${i + 1}`) ?? '');
  let result = '';
  if (done && ranked[0][1] > 0) {
    const [top, second] = [STYLE_PAGES[ranked[0][0]], STYLE_PAGES[ranked[1][0]]];
    result = `
    <section class="dash-card" id="result" aria-live="polite">
      <span class="eyebrow">Your result</span>
      <h2>${esc(top.style)}: ${esc(top.tagline)}</h2>
      <p>${esc(top.blurb)}</p>
      <ul class="checklist">${top.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p><a class="btn" href="/interior-designers/style/${esc(ranked[0][0])}">See ${esc(top.style.toLowerCase())} designers</a>
      <a class="btn btn-outline" href="/designers?style=${encodeURIComponent(top.style)}">Browse all ${esc(top.style.toLowerCase())} firms</a></p>
      <p class="muted">Second closest: <a href="/interior-designers/style/${esc(ranked[1][0])}">${esc(second.style)}</a> (${esc(second.tagline)}). Most homes blend two styles, so show your designer both.</p>
      <p class="muted small">Take it again below, or <a href="/resources">see all free resources</a>.</p>
    </section>`;
  } else if (answered > 0) {
    result = `<p class="calc-error" role="alert">Answer all ${QUIZ.length} questions to see your result (${answered} answered).</p>`;
  }
  const questions = QUIZ.map((q, i) => `
    <fieldset class="field">
      <legend><strong>${i + 1}. ${esc(q.q)}</strong></legend>
      ${q.options.map(([label], j) => `<label style="display:block;margin:6px 0;"><input type="radio" name="q${i + 1}" value="${j}"${picked(i) === String(j) ? ' checked' : ''} required> ${esc(label)}</label>`).join('')}
    </fieldset>`).join('');
  const body = `
  <section class="wrap" style="padding-top:36px;padding-bottom:8px;">
    ${breadcrumbNav(crumbs)}
    <h1>Which home style suits you? A 2-minute quiz</h1>
    <p class="lead">Seven quick questions. Pick the answer that feels most like you, and we will match you to one of six popular Singapore home styles.</p>
    ${result}
    <form class="panel wide" method="get" action="${path}#result">
      ${questions}
      <button class="btn" type="submit">Show my style</button>
    </form>
    <p class="muted small">Nothing is saved or sent anywhere. A quiz is a starting point, not a verdict.</p>
    ${faqHtml(QUIZ_FAQS)}
  </section>`;
  res.end(layout({
    title: 'Design Style Quiz: Find Your Home Style',
    description: 'Take a free two-minute quiz to find which popular Singapore home style suits you (minimalist, Scandinavian, industrial, modern, contemporary or classic), then see designers who work in it.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [breadcrumbSchema(site, crumbs), faqSchema(QUIZ_FAQS)],
  }));
}

// ----- /tools/renovation-budget-planner (online version of the Excel planner; runs in the browser, saves on this device only) -----
const BP_FAQS = [
  { q: 'Is my budget saved or sent anywhere?', a: 'No. Everything you type stays in your browser on this device (it is saved there so you can come back later). Nothing is sent to Layered or to any designer. Use "Clear everything" to wipe it.' },
  { q: 'Does the planner include prices?', a: 'No. You type in your own figures and quotes. For indicative 2026 ranges, use the cost calculator or the itemised estimator, then copy the numbers you trust into the Planned column.' },
  { q: 'How much buffer should I keep?', a: 'A buffer of 10% to 15% is commonly recommended, and resale homes often need more because problems appear once finishes come off. Treat the buffer as spent only when a change is agreed in writing.' },
  { q: 'Which GST setting should I choose?', a: 'GST-registered firms charge GST (9% in 2026; check the current rate with IRAS). Tick "my figures already include GST" if your quotes are GST-inclusive, otherwise the planner adds it for you.' },
  { q: 'Can I take it with me?', a: 'Use Print or save as PDF for a copy, or download the Excel planner from the resources page if you prefer to work in a spreadsheet.' },
];

function BP_JS() {
  return `
var CATS=${JSON.stringify(BUDGET_CATEGORIES)}, OUT=${JSON.stringify(OUTSIDE_ITEMS)}, KEY='layered-budget-v1';
${budgetSummary.toString()}
(function(){
  var $=function(id){return document.getElementById(id)};
  var FIELDS=['planned','a','b','c','chosen','actual'];
  function money(n){return 'S$'+Math.round(n).toLocaleString('en-SG')}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}}
  function save(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
  function read(){
    var d={ceiling:$('b-ceiling').value,bufferPct:$('b-buffer').value,gstPct:$('b-gst').value,gstIncluded:$('b-gstinc').checked,rows:{},outside:{}};
    [].forEach.call(document.querySelectorAll('input[data-row]'),function(el){var r=el.getAttribute('data-row'),f=el.getAttribute('data-f');(d.rows[r]=d.rows[r]||{})[f]=el.value});
    [].forEach.call(document.querySelectorAll('input[data-out]'),function(el){var r=el.getAttribute('data-out'),f=el.getAttribute('data-f');(d.outside[r]=d.outside[r]||{})[f]=el.value});
    return d;
  }
  function write(d){
    if(d.ceiling!=null)$('b-ceiling').value=d.ceiling;
    if(d.bufferPct!=null)$('b-buffer').value=d.bufferPct;
    if(d.gstPct!=null)$('b-gst').value=d.gstPct;
    $('b-gstinc').checked=!!d.gstIncluded;
    [].forEach.call(document.querySelectorAll('input[data-row]'),function(el){var v=d.rows&&d.rows[el.getAttribute('data-row')];if(v&&v[el.getAttribute('data-f')]!=null)el.value=v[el.getAttribute('data-f')]});
    [].forEach.call(document.querySelectorAll('input[data-out]'),function(el){var v=d.outside&&d.outside[el.getAttribute('data-out')];if(v&&v[el.getAttribute('data-f')]!=null)el.value=v[el.getAttribute('data-f')]});
  }
  function render(){
    var d=read(); save(d);
    var s=budgetSummary(d), h='';
    h+='<h2>Your summary</h2><dl class="bp-sum">';
    h+='<dt>Planned renovation total</dt><dd>'+money(s.totals.planned)+'</dd>';
    h+='<dt>Plus buffer ('+(Number(d.bufferPct)||0)+'%)</dt><dd>'+money(s.withBuffer)+'</dd>';
    h+='<dt>GST'+(d.gstIncluded?' (already in your figures)':' ('+(Number(d.gstPct)||0)+'%)')+'</dt><dd>'+money(s.gstAmt)+'</dd>';
    h+='<dt><strong>Renovation with buffer and GST</strong></dt><dd><strong>'+money(s.plannedAll)+'</strong></dd>';
    h+='<dt>Outside the contract (planned)</dt><dd>'+money(s.outside.planned)+'</dd>';
    h+='<dt><strong>Everything</strong></dt><dd><strong>'+money(s.everything)+'</strong></dd></dl>';
    if(s.ceiling){h+= s.over>0 ? '<p class="bp-flag bp-over">Over your ceiling by '+money(s.over)+'. Trim a category or the scope.</p>' : '<p class="bp-flag bp-ok">Within your ceiling of '+money(s.ceiling)+', with '+money(-s.over)+' to spare.</p>';}
    else h+='<p class="muted small">Enter your total budget ceiling to check against it.</p>';
    h+='<h3>Quotes</h3><dl class="bp-sum"><dt>Quote A</dt><dd>'+money(s.totals.a)+'</dd><dt>Quote B</dt><dd>'+money(s.totals.b)+'</dd><dt>Quote C</dt><dd>'+money(s.totals.c)+'</dd><dt>Chosen (with GST)</dt><dd>'+money(s.chosenWithGst)+'</dd>';
    if(s.chosenOver!==null)h+='<dt>Chosen vs planned</dt><dd>'+(s.chosenOver>0?'+':'')+money(s.chosenOver).replace('S$-','-S$')+'</dd>';
    h+='<dt>Spent so far</dt><dd>'+money(s.totals.actual+s.outside.actual)+'</dd></dl>';
    $('bp-result').innerHTML=h;
  }
  write(load()); render();
  document.getElementById('bp').addEventListener('input',render);
  $('bp-clear').addEventListener('click',function(){if(confirm('Clear everything you entered on this device?')){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}});
  $('bp-print').addEventListener('click',function(){window.print()});
})();`;
}

export async function budgetPlannerRoute(req, res, ctx) {
  const site = ctx.site;
  const path = '/tools/renovation-budget-planner';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Free resources', path: '/resources' }, { name: 'Renovation budget planner', path }];
  const num = (attrs) => `<input type="number" inputmode="decimal" min="0" step="any" ${attrs}>`;
  const rows = BUDGET_CATEGORIES.map(([k, label]) => `<tr><th scope="row">${esc(label)}</th>${['planned', 'a', 'b', 'c', 'chosen', 'actual'].map((f) => `<td>${num(`data-row="${k}" data-f="${f}" aria-label="${esc(label)}: ${f === 'a' || f === 'b' || f === 'c' ? 'quote ' + f.toUpperCase() : f}"`)}</td>`).join('')}</tr>`).join('');
  const outRows = OUTSIDE_ITEMS.map(([k, label]) => `<tr><th scope="row">${esc(label)}</th>${['planned', 'actual'].map((f) => `<td>${num(`data-out="${k}" data-f="${f}" aria-label="${esc(label)}: ${f}"`)}</td>`).join('')}</tr>`).join('');
  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(crumbs)}
    <span class="eyebrow">Free tool</span>
    <h1>Online renovation budget planner</h1>
    <p class="section-sub">Split your budget by category, line up quotes from up to three firms, add a buffer and GST, and see at once whether you are within your ceiling. It is the online version of our Excel planner. Your figures stay in your browser and are never sent to us.</p>
  </section>
  <section class="wrap calc-section">
    <div class="calc est bp" id="bp">
      <div class="est-setup">
        <div class="field"><label for="b-ceiling">Total budget ceiling (S$)</label>${num('id="b-ceiling"')}</div>
        <div class="field"><label for="b-buffer">Buffer (%)</label>${num('id="b-buffer" value="10" max="100"')}</div>
        <div class="field"><label for="b-gst">GST (%)</label>${num(`id="b-gst" value="${BUDGET_GST * 100}" max="100"`)}</div>
        <div class="field"><label><input type="checkbox" id="b-gstinc"> My figures already include GST</label></div>
        <div class="field est-buttons"><button type="button" class="btn btn-sm btn-outline" id="bp-print">Print or save as PDF</button> <button type="button" class="btn btn-sm btn-outline" id="bp-clear">Clear everything</button></div>
      </div>
      <div class="est-body">
        <div>
          <div class="table-scroll"><table class="data-table est-table bp-table">
            <caption style="position:absolute;left:-9999px">Renovation works by category</caption>
            <thead><tr><th scope="col">Category (S$)</th><th scope="col">Planned</th><th scope="col">Quote A</th><th scope="col">Quote B</th><th scope="col">Quote C</th><th scope="col">Chosen</th><th scope="col">Actual spent</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
          <h2>Outside the renovation contract</h2>
          <p class="muted">Things people forget. List them here so they do not quietly raid the renovation budget.</p>
          <div class="table-scroll"><table class="data-table est-table bp-table">
            <thead><tr><th scope="col">Item (S$)</th><th scope="col">Planned</th><th scope="col">Actual spent</th></tr></thead>
            <tbody>${outRows}</tbody>
          </table></div>
        </div>
        <aside class="calc-result est-result" id="bp-result" aria-live="polite"><p class="muted">Enter some figures to see your summary.</p></aside>
      </div>
    </div>
    <noscript><p class="muted">The planner needs JavaScript. You can download the <a href="/downloads/layered-renovation-budget-planner.xlsx">Excel version</a> instead.</p></noscript>
  </section>
  <section class="wrap prose-section">
    <h2>How to use it</h2>
    <div class="prose">
      <p>Start with your <strong>ceiling</strong>, the most you will spend, then split it across categories in <strong>Planned</strong>. Need a starting point? The <a href="/tools/renovation-cost-estimator">itemised estimator</a> and <a href="/tools/renovation-cost-calculator">cost calculator</a> give indicative 2026 ranges you can adjust.</p>
      <p>When quotes arrive, enter each firm's price per category in Quote A, B and C, then put your pick in <strong>Chosen</strong>. During the works, record real payments in <strong>Actual spent</strong> after each stage. Always compare <a href="/blog/how-to-read-a-renovation-quotation-singapore">itemised quotations</a> on the same scope.</p>
      <p>Prefer a spreadsheet? <a href="/downloads/layered-renovation-budget-planner.xlsx" download>Download the Excel planner</a>. This planner is general information, not financial or professional advice.</p>
    </div>
    ${faqHtml(BP_FAQS)}
    <div class="cta-box">
      <h2>Ready for quotes?</h2>
      <p>Compare Singapore interior designers, check their HDB licence and CaseTrust credentials, then get matched for free.</p>
      <p><a class="btn btn-sm" href="/designers">Browse designers</a> <a class="btn btn-sm btn-outline" href="/resources">More free resources</a></p>
    </div>
  </section>
  <script>${BP_JS()}</script>`;
  res.end(layout({
    title: 'Online Renovation Budget Planner Singapore (Free)',
    description: 'Free online renovation budget planner for Singapore homeowners: split your budget by category, compare three quotes, add a buffer and GST, and check your ceiling.',
    path, site, body, business: ctx.business, flash: ctx.flash,
    jsonLd: [
      breadcrumbSchema(site, crumbs),
      faqSchema(BP_FAQS),
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Online renovation budget planner', url: abs(site, path), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'en-SG', offers: { '@type': 'Offer', price: '0', priceCurrency: 'SGD' } },
    ],
  }));
}
