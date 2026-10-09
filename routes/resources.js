// routes/resources.js — /resources (downloads hub) and /tools/design-style-quiz.
import { esc, layout } from '../lib/render.js';
import { breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { STYLE_PAGES } from '../content/landing.js';
import { RESOURCES, RESOURCES_REVIEWED, QUIZ } from '../content/resources.js';

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
