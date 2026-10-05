import { db } from '../db.js';
import { esc, layout } from '../lib/render.js';
import { credentialBadges, verifiedOn, CASETRUST_OPTIONS } from '../lib/credentials.js';
import { breadcrumbNav } from '../lib/components.js';

const MAX = 4;
const CT_LABEL = Object.fromEntries(CASETRUST_OPTIONS.map((o) => [o.value, o.label]));

const list = (csv) => (csv || '').split(',').filter(Boolean).map(esc).join(', ') || '<span class="muted">Not listed</span>';

function credCell(b, kind) {
  const value = kind === 'hdb' ? b.hdb_licence_no : b.casetrust;
  if (!value) return '<span class="muted">Not declared</span>';
  const label = kind === 'hdb' ? `Licence ${esc(value)}` : esc(CT_LABEL[value] || value);
  const on = verifiedOn(b, kind);
  return `${label}<br><span class="muted">${on ? `Checked by Layered on ${esc(on)}` : 'Self-declared, not checked'}</span>`;
}

// Side-by-side view. The shortlist itself lives in the visitor's browser; the slugs arrive as ?d=a,b,c.
export async function compareRoute(req, res, ctx, url) {
  const slugs = [...new Set((url.searchParams.get('d') || '').split(',').map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)))].slice(0, MAX);
  const rows = slugs.map((s) => db.prepare('SELECT * FROM businesses WHERE slug = ?').get(s)).filter(Boolean);
  const projCount = db.prepare('SELECT COUNT(*) n FROM projects WHERE business_id = ?');

  let inner;
  if (!slugs.length) {
    inner = `<div class="notice" id="cmp-empty"><p>Your shortlist is empty. Tap the heart on any designer to save up to ${MAX}, then come back here to compare them.</p><p><a class="btn" href="/designers">Browse designers</a></p></div>
    <script>(function(){try{var v=JSON.parse(localStorage.getItem('layered.shortlist')||'[]');if(v.length)location.replace('/compare?d='+encodeURIComponent(v.slice(0,${MAX}).join(',')));}catch(e){}})();</script>`;
  } else if (!rows.length) {
    inner = '<div class="notice"><p>None of those designers could be found. They may have been removed.</p><p><a class="btn" href="/designers">Browse designers</a></p></div>';
  } else {
    const head = rows.map((b) => `<th scope="col"><a class="cmp-name" href="/designers/${esc(b.slug)}">${esc(b.company_name)}</a><button type="button" class="btn btn-outline btn-sm" data-save="${esc(b.slug)}" data-remove-col>Remove</button></th>`).join('');
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${rows.map((b) => `<td>${fn(b)}</td>`).join('')}</tr>`;
    inner = `<div class="compare-scroll"><table class="compare-table">
      <caption class="sr-only">Comparison of ${rows.length} interior designers</caption>
      <thead><tr><td></td>${head}</tr></thead>
      <tbody>
        ${row('Service areas', (b) => esc(b.service_areas || 'Singapore'))}
        ${row('Property types', (b) => list(b.property_types))}
        ${row('Styles', (b) => list(b.styles))}
        ${row('HDB licence', (b) => credCell(b, 'hdb'))}
        ${row('CaseTrust', (b) => credCell(b, 'casetrust'))}
        ${row('Projects shown', (b) => String(projCount.get(b.id).n))}
        ${row('Next step', (b) => `<a href="/designers/${esc(b.slug)}">View profile</a>`)}
      </tbody></table></div>
    <p class="muted">Layered does not rate or rank firms. Credentials are self-declared unless a "checked" date is shown; confirm any licence with the issuing body and read the contract before paying a deposit. <a href="/guides/how-to-choose-an-interior-designer-singapore">How to choose</a>.</p>
    <script>document.addEventListener('click',function(e){if(e.target.closest('[data-remove-col]')){setTimeout(function(){var d=window.layeredShortlist?window.layeredShortlist.read():[];location.replace('/compare'+(d.length?'?d='+encodeURIComponent(d.join(',')):''));},0);}});</script>`;
  }

  const body = `
  <section class="wrap page-head">
    ${breadcrumbNav([{ name: 'Home', path: '/' }, { name: 'Compare designers', path: '/compare' }])}
    <h1>Compare designers</h1>
    <p class="muted">Your shortlist, side by side. Saved on this device only.</p>
  </section>
  <section class="wrap">${inner}</section>`;
  res.end(layout({ title: 'Compare designers', description: 'Compare interior designers side by side.', path: '/compare', noindex: true, site: ctx.site, body, business: ctx.business }));
}
