// routes/content.js — SEO landing pages (by property type / style) and renovation guides.
import { db } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { abs, breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml, formatDate } from '../lib/components.js';
import { GUIDES, guideBySlug, REVIEWED, REVIEWED_LABEL } from '../content/guides.js';
import { PROPERTY_PAGES, STYLE_PAGES } from '../content/landing.js';
import { CHECKLIST } from '../content/checklist.js';
import { designerCard, leadFormHtml } from './public.js';

const notFound = (res, ctx, site) => {
  res.statusCode = 404;
  res.end(layout({ title: 'Page not found', noindex: true, site, business: ctx.business, body: '<div class="wrap" style="padding:60px 0;"><h1>404 — Page not found</h1><p><a href="/guides">Renovation guides</a> · <a href="/designers">Find designers</a></p></div>' }));
};

function itemListSchema(site, firms) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: firms.slice(0, 20).map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(site, `/designers/${b.slug}`), name: b.company_name })),
  };
}

const firmGrid = (firms, empty) => (firms.length
  ? `<div class="grid grid-3">${firms.map(designerCard).join('')}</div>`
  : `<p class="muted">${empty}</p>`);

const guideLinks = (slugs) => slugs.map(guideBySlug).filter(Boolean)
  .map((g) => `<li><a href="/guides/${g.slug}">${esc(g.title)}</a></li>`).join('');

// ----- /interior-designers/:type -----
export async function propertyLandingRoute(req, res, ctx, key) {
  const page = PROPERTY_PAGES[key];
  const site = ctx.site;
  if (!page) return notFound(res, ctx, site);
  const path = `/interior-designers/${key}`;
  const firms = db.prepare("SELECT * FROM businesses WHERE (',' || property_types || ',') LIKE ? ORDER BY featured DESC, created_at DESC").all(`%,${page.propertyType},%`);
  const trail = [{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }, { name: page.title.replace(' in Singapore', ''), path }];
  const others = Object.entries(PROPERTY_PAGES).filter(([k]) => k !== key)
    .map(([k, p]) => `<li><a href="/interior-designers/${k}">${esc(p.title)}</a></li>`).join('');
  const styles = Object.entries(STYLE_PAGES).map(([k, s]) => `<li><a href="/interior-designers/style/${k}">${esc(s.style)} interior designers</a></li>`).join('');

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(trail)}
    <h1>${esc(page.h1)}</h1>
    <div class="prose">${page.intro}</div>
  </section>
  <section class="wrap">
    <h2>${esc(page.propertyType)} interior designers on Layered</h2>
    ${firmGrid(firms, `No ${esc(page.propertyType)} designers are listed yet. <a href="/signup">List your business</a> or <a href="/designers">browse all designers</a>.`)}
  </section>
  <section class="wrap prose-section">
    <h2>${esc(page.costTitle)}</h2>
    <div class="prose">${page.cost}</div>
    <h2>What to look for in a ${esc(page.propertyType === 'Commercial' ? 'commercial fit-out firm' : `${page.propertyType} interior designer`)}</h2>
    <ul class="checklist">${page.lookFor.map((l) => `<li>${l}</li>`).join('')}</ul>
    ${faqHtml(page.faqs)}
  </section>
  <section class="wrap">
    ${leadFormHtml({ propertyType: page.propertyType })}
  </section>
  <section class="wrap related">
    <h2>Keep exploring</h2>
    <div class="related-cols">
      <div><h3>Renovation guides</h3><ul>${guideLinks(page.related)}<li><a href="/guides">All renovation guides</a></li></ul></div>
      <div><h3>Other property types</h3><ul>${others}</ul></div>
      <div><h3>By style</h3><ul>${styles}</ul></div>
    </div>
  </section>`;

  res.end(layout({
    title: page.title,
    description: page.description,
    path, site,
    business: ctx.business,
    flash: ctx.flash,
    body,
    jsonLd: [breadcrumbSchema(site, trail), faqSchema(page.faqs), itemListSchema(site, firms)],
  }));
}

// ----- /interior-designers/style/:style -----
export async function styleLandingRoute(req, res, ctx, key) {
  const page = STYLE_PAGES[key];
  const site = ctx.site;
  if (!page) return notFound(res, ctx, site);
  const path = `/interior-designers/style/${key}`;
  const title = `${page.style} Interior Designers in Singapore`;
  const firms = db.prepare("SELECT * FROM businesses WHERE (',' || styles || ',') LIKE ? ORDER BY featured DESC, created_at DESC").all(`%,${page.style},%`);
  const trail = [{ name: 'Home', path: '/' }, { name: 'Interior designers', path: '/designers' }, { name: `${page.style} style`, path }];
  const otherStyles = Object.entries(STYLE_PAGES).filter(([k]) => k !== key).map(([k, s]) => `<li><a href="/interior-designers/style/${k}">${esc(s.style)} interior designers</a></li>`).join('');
  const types = Object.entries(PROPERTY_PAGES).map(([k, p]) => `<li><a href="/interior-designers/${k}">${esc(p.title)}</a></li>`).join('');
  const description = `${page.style} interior designers in Singapore: ${page.tagline}. Compare firms for HDB, condo and landed homes.`;

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(trail)}
    <h1>${esc(title)}</h1>
    <div class="prose"><p>${esc(page.blurb)}</p>
    <h2>Hallmarks of ${esc(page.style.toLowerCase())} design</h2>
    <ul class="checklist">${page.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
  </section>
  <section class="wrap">
    <h2>${esc(page.style)} interior designers on Layered</h2>
    ${firmGrid(firms, `No designers have listed ${esc(page.style.toLowerCase())} as a specialty yet. <a href="/designers">Browse all designers</a>.`)}
  </section>
  <section class="wrap">${leadFormHtml({ style: page.style })}</section>
  <section class="wrap related">
    <h2>Keep exploring</h2>
    <div class="related-cols">
      <div><h3>By property type</h3><ul>${types}</ul></div>
      <div><h3>Other styles</h3><ul>${otherStyles}</ul></div>
      <div><h3>Guides</h3><ul><li><a href="/guides/how-to-choose-an-interior-designer-singapore">How to choose an interior designer</a></li><li><a href="/guides">All renovation guides</a></li></ul></div>
    </div>
  </section>`;

  res.end(layout({ title, description, path, site, business: ctx.business, flash: ctx.flash, body, jsonLd: [breadcrumbSchema(site, trail), itemListSchema(site, firms)] }));
}

// ----- /guides -----
export async function guidesIndexRoute(req, res, ctx) {
  const site = ctx.site;
  const trail = [{ name: 'Home', path: '/' }, { name: 'Renovation guides', path: '/guides' }];
  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav(trail)}
    <h1>Renovation guides for Singapore homeowners</h1>
    <p class="section-sub">Plain-English guides to renovation costs, HDB and condo rules, and choosing the right interior designer. Last reviewed ${esc(REVIEWED_LABEL)}.</p>
    <a class="card guide-feature" href="/guides/${CHECKLIST.slug}">
      <div class="body"><span class="eyebrow">Start here</span><h2>${esc(CHECKLIST.h1)}</h2><p>${esc(CHECKLIST.summary)}</p><span class="more">Open the checklist →</span></div>
    </a>
    <div class="grid grid-2">
      ${GUIDES.map((g) => `
      <a class="card guide-card" href="/guides/${g.slug}">
        <div class="body"><h2>${esc(g.title)}</h2><p>${esc(g.summary)}</p><span class="more">Read the guide →</span></div>
      </a>`).join('')}
    </div>
  </section>`;
  res.end(layout({
    title: 'Renovation Guides for Singapore Homeowners',
    description: 'Guides to HDB and condo renovation costs, permits and rules, CaseTrust and HDB licences, and how to choose an interior designer in Singapore.',
    path: '/guides', site, business: ctx.business, flash: ctx.flash, body,
    jsonLd: [breadcrumbSchema(site, trail), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Renovation guides', url: abs(site, '/guides'), inLanguage: 'en-SG' }],
  }));
}

// ----- /guides/:slug -----
export async function guideRoute(req, res, ctx, slug) {
  const g = guideBySlug(slug);
  const site = ctx.site;
  if (!g) return notFound(res, ctx, site);
  const path = `/guides/${g.slug}`;
  const trail = [{ name: 'Home', path: '/' }, { name: 'Renovation guides', path: '/guides' }, { name: g.title, path }];
  const toc = g.sections.map((s, i) => `<li><a href="#s${i + 1}">${esc(s.h2)}</a></li>`).join('');
  const body = `
  <article class="wrap page-head guide">
    ${breadcrumbNav(trail)}
    <h1>${esc(g.h1)}</h1>
    <p class="byline muted">Last reviewed <time datetime="${REVIEWED}">${esc(formatDate(REVIEWED))}</time> · Figures are indicative; always compare itemised quotes.</p>
    <div class="prose">${g.intro}</div>
    <nav class="toc" aria-label="In this guide"><strong>In this guide</strong><ol>${toc}</ol></nav>
    <div class="prose">
      ${g.sections.map((s, i) => `<h2 id="s${i + 1}">${esc(s.h2)}</h2>${s.html}`).join('')}
    </div>
    ${faqHtml(g.faqs)}
    <div class="cta-box">
      <h2>Find a designer for your home</h2>
      <p>Compare Singapore interior designers and renovation firms, then get matched for free.</p>
      <p>${g.links.map(([h, l]) => `<a class="btn btn-sm" href="${h}">${esc(l)}</a>`).join(' ')} <a class="btn btn-sm btn-outline" href="/#get-recommendations">Get matched</a></p>
    </div>
    <section class="related"><h2>Related guides</h2><ul>${guideLinks(g.related)}</ul></section>
  </article>`;
  res.end(layout({
    title: g.title,
    description: g.description,
    path, site, business: ctx.business, flash: ctx.flash, body, ogType: 'article',
    jsonLd: [
      breadcrumbSchema(site, trail),
      faqSchema(g.faqs),
      {
        '@context': 'https://schema.org', '@type': 'Article',
        headline: g.h1, description: g.description, inLanguage: 'en-SG',
        mainEntityOfPage: abs(site, path), dateModified: REVIEWED, datePublished: REVIEWED,
        author: { '@id': `${site}/#organization` }, publisher: { '@id': `${site}/#organization` },
        image: abs(site, '/og-default.jpg'),
      },
    ],
  }));
}

// ----- /guides/renovation-checklist-singapore (interactive checklist) -----
export async function checklistRoute(req, res, ctx) {
  const c = CHECKLIST;
  const site = ctx.site;
  const path = `/guides/${c.slug}`;
  const trail = [{ name: 'Home', path: '/' }, { name: 'Renovation guides', path: '/guides' }, { name: 'Renovation checklist', path }];
  const total = c.phases.reduce((n, p) => n + p.items.length, 0);

  const body = `
  <article class="wrap page-head guide checklist-page">
    ${breadcrumbNav(trail)}
    <h1>${esc(c.h1)}</h1>
    <p class="byline muted">Last reviewed <time datetime="${REVIEWED}">${esc(formatDate(REVIEWED))}</time> · Rules and costs change; confirm with HDB and your management corporation.</p>
    <div class="prose">${c.intro}</div>

    <div class="cl-progress" id="cl-progress" data-total="${total}">
      <div class="cl-progress-top"><strong><span id="cl-done">0</span> of ${total} done</strong>
        <span class="cl-actions"><button type="button" class="btn btn-sm btn-outline" id="cl-print">Print</button> <button type="button" class="btn btn-sm btn-outline" id="cl-reset">Reset</button></span></div>
      <div class="cl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0"><div id="cl-bar-fill"></div></div>
      <p class="muted small">Your ticks are saved in this browser only. Nothing is sent to us.</p>
    </div>

    <nav class="toc" aria-label="Checklist stages"><strong>The eight stages</strong><ol>${c.phases.map((p) => `<li><a href="#${p.id}">${esc(p.title.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol></nav>

    <h2 id="timeline">Timeline at a glance</h2>
    <div class="table-scroll"><table class="data-table"><thead><tr><th>When</th><th>What happens</th></tr></thead><tbody>
      ${c.timeline.map(([w, t]) => `<tr><td><strong>${esc(w)}</strong></td><td>${esc(t)}</td></tr>`).join('')}
    </tbody></table></div>

    ${c.phases.map((p) => `
    <section class="cl-phase" id="${p.id}">
      <h2>${esc(p.title)}</h2>
      <p class="cl-when">${esc(p.when)}</p>
      <p>${esc(p.intro)}</p>
      <ul class="cl-list">
        ${p.items.map(([id, t, d]) => `<li><label><input type="checkbox" data-cl="${id}"><span class="cl-box" aria-hidden="true"></span><span class="cl-text"><strong>${esc(t)}</strong><span class="cl-desc">${d}</span></span></label></li>`).join('')}
      </ul>
    </section>`).join('')}

    ${faqHtml(c.faqs)}
    <div class="cta-box">
      <h2>Find a designer you can check</h2>
      <p>Compare Singapore interior designers and renovation firms, filter by HDB licence and CaseTrust credentials, then get matched for free.</p>
      <p><a class="btn btn-sm" href="/designers">Browse designers</a> <a class="btn btn-sm btn-outline" href="/#get-recommendations">Get matched</a></p>
    </div>
    <section class="related"><h2>Related reading</h2><ul>
      <li><a href="/guides/how-to-choose-an-interior-designer-singapore">How to choose an interior designer</a></li>
      <li><a href="/guides/hdb-renovation-permit-and-rules">HDB renovation permit and rules</a></li>
      <li><a href="/blog/bto-renovation-timeline-singapore">BTO renovation timeline</a></li>
      <li><a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust and HDB licence explained</a></li>
    </ul></section>
  </article>
  <script>${CHECKLIST_JS}</script>`;

  res.end(layout({
    title: c.title, description: c.description, path, site, body, business: ctx.business, flash: ctx.flash, ogType: 'article',
    jsonLd: [
      breadcrumbSchema(site, trail),
      faqSchema(c.faqs),
      { '@context': 'https://schema.org', '@type': 'Article', headline: c.h1, description: c.description, inLanguage: 'en-SG', mainEntityOfPage: abs(site, path), dateModified: REVIEWED, datePublished: REVIEWED, author: { '@id': `${site}/#organization` }, publisher: { '@id': `${site}/#organization` }, image: abs(site, '/og-default.jpg') },
    ],
  }));
}

// Progress is stored in localStorage; the page works (read-only) without JS.
const CHECKLIST_JS = `
(function(){
  var KEY='layered-renovation-checklist-v1', boxes=[].slice.call(document.querySelectorAll('input[data-cl]'));
  var state={}; try{state=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
  function paint(){
    var done=boxes.filter(function(b){return b.checked}).length, total=boxes.length;
    document.getElementById('cl-done').textContent=done;
    document.getElementById('cl-bar-fill').style.width=(total?done/total*100:0)+'%';
    document.querySelector('.cl-bar').setAttribute('aria-valuenow',done);
    boxes.forEach(function(b){b.closest('li').classList.toggle('done',b.checked)});
  }
  boxes.forEach(function(b){b.checked=!!state[b.getAttribute('data-cl')]; b.addEventListener('change',function(){state[b.getAttribute('data-cl')]=b.checked; save(); paint()})});
  document.getElementById('cl-reset').addEventListener('click',function(){ if(confirm('Clear all ticks?')){state={}; save(); boxes.forEach(function(b){b.checked=false}); paint()} });
  document.getElementById('cl-print').addEventListener('click',function(){window.print()});
  paint();
})();`;
