// routes/blogAdmin.js — blog authoring for admins (see lib/admin.js). Lives under /dashboard so it
// inherits the auth gate, noindex headers and no-store caching.
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { slugify } from '../lib/markdown.js';
import { isAdmin } from '../lib/admin.js';
import { BLOG_CATEGORIES } from '../content/blog-meta.js';
import { dashLayout } from './dashboard.js';

const redirect = (res, to) => { res.writeHead(302, { Location: to }); res.end(); };
const forbidden = (res, ctx) => {
  res.statusCode = 403;
  res.end(dashLayout('/dashboard/blog', '<h1>Not allowed</h1><p class="muted">Blog editing is limited to admins. Set <code>ADMIN_EMAILS</code> to include your login email.</p>', ctx));
};
const clean = (v, max) => String(v || '').replace(/\r/g, '').trim().slice(0, max);
const safeImage = (u) => {
  const v = clean(u, 500);
  return /^(https?:\/\/|\/(?!\/))/i.test(v) ? v : '';
};

export function uniqueSlug(base, ignoreId = 0) {
  let slug = slugify(base) || 'post';
  const root = slug;
  let n = 2;
  while (db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, ignoreId)) slug = `${root}-${n++}`;
  return slug;
}

export async function blogAdminList(req, res, ctx) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const posts = db.prepare('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC, id DESC').all();
  const inner = `
    <div class="head-row"><h1>Blog</h1><a class="btn btn-sm" href="/dashboard/blog/new">Write a new article</a></div>
    <p class="muted">Write in Markdown, check the SEO scorecard, then publish. Published articles appear on <a href="/blog" target="_blank">/blog</a>, in the sitemap and in the RSS feed automatically.</p>
    ${posts.some((p) => p.status === 'submitted') ? `<div class="dash-card"><h2 style="margin-top:0;">Firm submissions awaiting review</h2>${posts.filter((p) => p.status === 'submitted').map((p) => `
      <div class="review-item"><p><strong>${esc(p.title)}</strong> <span class="muted">by ${esc(p.author_name)}</span></p>
      <p><a class="btn btn-sm btn-outline" href="/dashboard/blog/${p.id}/edit">Read &amp; edit</a>
      <form method="post" action="/dashboard/articles/${p.id}/approve" class="inline"><button class="btn btn-sm" type="submit">Approve &amp; publish</button></form></p>
      <form method="post" action="/dashboard/articles/${p.id}/return"><div class="field"><label for="n${p.id}">Note to the firm (what to change)</label><input id="n${p.id}" name="note" maxlength="400" placeholder="e.g. Please add sources for the price ranges"></div><button class="btn btn-sm btn-outline" type="submit">Return to firm</button></form></div>`).join('')}</div>` : ''}
    <div class="dash-card">
      ${posts.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
      ${posts.map((p) => `<tr>
        <td><a href="/dashboard/blog/${p.id}/edit"><strong>${esc(p.title)}</strong></a><br><span class="muted">/blog/${esc(p.slug)}</span></td>
        <td>${esc(p.category)}</td>
        <td><span class="status-pill status-${p.status === 'published' ? 'won' : 'contacted'}">${esc(p.status)}</span></td>
        <td class="muted">${esc(String(p.updated_at || '').slice(0, 10))}</td>
        <td class="actions-row">
          <a class="btn btn-sm btn-outline" href="/dashboard/blog/${p.id}/edit">Edit</a>
          <a class="btn btn-sm btn-outline" href="/blog/${esc(p.slug)}" target="_blank">${p.status === 'published' ? 'View' : 'Preview'}</a>
        </td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No articles yet.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/blog', inner, ctx));
}

export async function blogAdminEditor(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const p = id ? db.prepare('SELECT * FROM posts WHERE id = ?').get(id) : null;
  if (id && !p) return redirect(res, '/dashboard/blog?err=' + encodeURIComponent('Article not found.'));
  const v = p || { title: '', slug: '', excerpt: '', body: '', category: BLOG_CATEGORIES[0].name, tags: '', focus_keyword: '', meta_title: '', meta_description: '', cover_image: '', cover_alt: '', author_name: 'Layered Editorial', status: 'draft' };

  const inner = `
    <div class="head-row"><h1>${p ? 'Edit article' : 'New article'}</h1><a class="btn btn-sm btn-outline" href="/dashboard/blog">All articles</a></div>
    <div class="editor-grid">
      <form class="panel wide" method="post" action="/dashboard/blog/save" id="post-form">
        <input type="hidden" name="id" value="${p ? p.id : ''}">
        <div class="field"><label for="p-title">Title (H1)</label><input id="p-title" type="text" name="title" value="${esc(v.title)}" maxlength="120" required></div>
        <div class="two-col">
          <div class="field"><label for="p-focus">Focus keyword</label><input id="p-focus" type="text" name="focus_keyword" value="${esc(v.focus_keyword)}" maxlength="80" placeholder="e.g. hdb kitchen renovation cost"><p class="hint">The one phrase this article should rank for.</p></div>
          <div class="field"><label for="p-category">Category</label><select id="p-category" name="category">${BLOG_CATEGORIES.map((c) => `<option${c.name === v.category ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="p-excerpt">Intro / excerpt</label><textarea id="p-excerpt" name="excerpt" maxlength="300" rows="3">${esc(v.excerpt)}</textarea><p class="hint">Shown under the title and on cards. Up to 300 characters.</p></div>
        <div class="field"><label for="p-body">Article (Markdown)</label><textarea id="p-body" name="body" rows="26" class="mono">${esc(v.body)}</textarea>
          <p class="hint">Use <code>## Heading</code> for sections, <code>- item</code> for lists, <code>**bold**</code>, <code>[text](/interior-designers/hdb)</code> for links, <code>| A | B |</code> tables. Raw HTML is not allowed. Link to at least two Layered pages.</p></div>
        <div class="two-col">
          <div class="field"><label for="p-meta-title">SEO title (optional)</label><input id="p-meta-title" type="text" name="meta_title" value="${esc(v.meta_title)}" maxlength="90" placeholder="Defaults to: Title | Layered"><p class="hint"><span id="c-title">0</span> chars · aim for 30–60</p></div>
          <div class="field"><label for="p-slug">URL slug</label><input id="p-slug" type="text" name="slug" value="${esc(v.slug)}" maxlength="80" placeholder="auto from title"><p class="hint">/blog/<span id="slug-preview"></span></p></div>
        </div>
        <div class="field"><label for="p-meta-desc">Meta description</label><textarea id="p-meta-desc" name="meta_description" rows="2" maxlength="200">${esc(v.meta_description)}</textarea><p class="hint"><span id="c-desc">0</span> chars · aim for 120–160, include the focus keyword and a reason to click</p></div>
        <div class="two-col">
          <div class="field"><label for="p-cover">Cover image URL</label><input id="p-cover" type="text" name="cover_image" value="${esc(v.cover_image)}" placeholder="/images/cover-costs.jpg or https://…"><p class="hint">Leave blank to use the category image. 1200×630 works best.</p></div>
          <div class="field"><label for="p-cover-alt">Cover image alt text</label><input id="p-cover-alt" type="text" name="cover_alt" value="${esc(v.cover_alt)}" maxlength="160" placeholder="Describe the image"></div>
        </div>
        <div class="two-col">
          <div class="field"><label for="p-tags">Tags (comma-separated)</label><input id="p-tags" type="text" name="tags" value="${esc(v.tags)}" maxlength="200" placeholder="hdb, kitchen, cost"></div>
          <div class="field"><label for="p-author">Author name</label><input id="p-author" type="text" name="author_name" value="${esc(v.author_name)}" maxlength="80"></div>
        </div>
        <div class="actions-row">
          <button class="btn" type="submit" name="intent" value="publish">${v.status === 'published' ? 'Save & keep published' : 'Publish'}</button>
          <button class="btn btn-outline" type="submit" name="intent" value="draft">${v.status === 'published' ? 'Unpublish to draft' : 'Save draft'}</button>
          ${p ? `<a class="btn btn-outline" href="/blog/${esc(p.slug)}" target="_blank">${p.status === 'published' ? 'View live' : 'Preview'}</a>` : ''}
        </div>
      </form>
      <aside class="seo-panel" aria-live="polite">
        <h2>SEO scorecard</h2>
        <p class="muted small" id="seo-score">Checking…</p>
        <ul id="seo-checks"></ul>
      </aside>
    </div>
    ${p ? `<form method="post" action="/dashboard/blog/${p.id}/delete" onsubmit="return confirm('Delete this article permanently?')" style="margin-top:18px"><button class="btn btn-danger btn-sm" type="submit">Delete article</button></form>` : ''}
    <script>${SEO_PANEL_JS}</script>`;
  res.end(dashLayout('/dashboard/blog', inner, ctx));
}

export async function blogAdminSave(req, res, ctx, fields) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  const id = parseInt(fields.id, 10) || 0;
  const existing = id ? db.prepare('SELECT * FROM posts WHERE id = ?').get(id) : null;
  const title = clean(fields.title, 120);
  if (!title) return redirect(res, (id ? `/dashboard/blog/${id}/edit` : '/dashboard/blog/new') + '?err=' + encodeURIComponent('A title is required.'));

  const category = BLOG_CATEGORIES.some((c) => c.name === fields.category) ? fields.category : BLOG_CATEGORIES[0].name;
  const slug = uniqueSlug(clean(fields.slug, 80) || title, existing ? existing.id : 0);
  const publish = fields.intent === 'publish';
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const row = {
    slug, title,
    excerpt: clean(fields.excerpt, 300),
    body: clean(fields.body, 100000),
    category,
    tags: clean(fields.tags, 200).split(',').map((t) => t.trim()).filter(Boolean).join(', '),
    focus_keyword: clean(fields.focus_keyword, 80),
    meta_title: clean(fields.meta_title, 90),
    meta_description: clean(fields.meta_description, 200),
    cover_image: safeImage(fields.cover_image),
    cover_alt: clean(fields.cover_alt, 160),
    author_name: clean(fields.author_name, 80) || 'Layered Editorial',
    status: publish ? 'published' : 'draft',
  };
  if (publish && !row.body) return redirect(res, (id ? `/dashboard/blog/${id}/edit` : '/dashboard/blog/new') + '?err=' + encodeURIComponent('Add some article text before publishing.'));

  if (existing) {
    const publishedAt = publish ? (existing.published_at || now) : existing.published_at;
    db.prepare(`UPDATE posts SET slug=?, title=?, excerpt=?, body=?, category=?, tags=?, focus_keyword=?, meta_title=?, meta_description=?, cover_image=?, cover_alt=?, author_name=?, status=?, published_at=?, updated_at=? WHERE id=?`)
      .run(row.slug, row.title, row.excerpt, row.body, row.category, row.tags, row.focus_keyword, row.meta_title, row.meta_description, row.cover_image, row.cover_alt, row.author_name, row.status, publishedAt, now, existing.id);
    return redirect(res, `/dashboard/blog/${existing.id}/edit?ok=` + encodeURIComponent(publish ? 'Saved and published.' : 'Saved as draft.'));
  }
  const info = db.prepare(`INSERT INTO posts (slug, title, excerpt, body, category, tags, focus_keyword, meta_title, meta_description, cover_image, cover_alt, author_name, status, published_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(row.slug, row.title, row.excerpt, row.body, row.category, row.tags, row.focus_keyword, row.meta_title, row.meta_description, row.cover_image, row.cover_alt, row.author_name, row.status, publish ? now : null, now, now);
  return redirect(res, `/dashboard/blog/${info.lastInsertRowid}/edit?ok=` + encodeURIComponent(publish ? 'Published.' : 'Draft saved.'));
}

export async function blogAdminDelete(req, res, ctx, id) {
  if (!isAdmin(ctx.business)) return forbidden(res, ctx);
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  return redirect(res, '/dashboard/blog?ok=' + encodeURIComponent('Article deleted.'));
}

// Runs in the editor: live character counters and SEO checks. Plain ES5-ish, no dependencies.
const SEO_PANEL_JS = `
(function(){
  var $=function(id){return document.getElementById(id)};
  var f={title:$('p-title'),focus:$('p-focus'),body:$('p-body'),mt:$('p-meta-title'),md:$('p-meta-desc'),slug:$('p-slug'),cover:$('p-cover'),alt:$('p-cover-alt'),ex:$('p-excerpt')};
  function slugify(s){return s.toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,80)}
  function check(ok,warnOnly,label,detail){return {ok:ok,warn:warnOnly,label:label,detail:detail||''}}
  function run(){
    var title=f.title.value.trim(), kw=f.focus.value.trim().toLowerCase(), body=f.body.value, md=f.md.value.trim();
    var seoTitle=(f.mt.value.trim()||title+' | Layered');
    $('c-title').textContent=seoTitle.length; $('c-desc').textContent=md.length;
    $('slug-preview').textContent=f.slug.value.trim()?slugify(f.slug.value):slugify(title);
    var words=(body.replace(/[#>*|\\-\\[\\]()!]/g,' ').match(/\\S+/g)||[]).length;
    var plain=body.toLowerCase();
    var STOP={vs:1,'in':1,to:1,of:1,'for':1,the:1,and:1,'a':1,an:1,'on':1,'with':1};
    var kwWords=kw.split(/\\s+/).filter(function(w){return w.length>1&&!STOP[w]});
    // A keyword "matches" a piece of text when every word of it appears (so "japandi interior design in singapore" matches "japandi interior design singapore").
    function has(text){text=text.toLowerCase();return kwWords.length>0&&kwWords.every(function(w){return text.indexOf(w)>-1})}
    var first=plain.split(/\\s+/).slice(0,120).join(' ');
    var h2s=(body.match(/^##\\s+.*$/gm)||[]);
    var links=(body.match(/\\]\\(\\/[^)]+\\)/g)||[]).length;
    var blocks=body.split(/\\n+/).filter(function(l){return l.trim()});
    var kwCount=kw?blocks.filter(has).length:0;
    var checks=[
      check(!!kw,false,'Focus keyword set'),
      check(seoTitle.length>=30&&seoTitle.length<=60,true,'SEO title 30–60 characters',seoTitle.length+' now'),
      check(!kw||has(seoTitle),false,'Keyword in the SEO title'),
      check(md.length>=120&&md.length<=160,true,'Meta description 120–160 characters',md.length+' now'),
      check(!kw||has(md),true,'Keyword in the meta description'),
      check(!kw||has(first),true,'Keyword in the first 100 words'),
      check(!kw||h2s.some(has),true,'Keyword in at least one H2'),
      check(!kw||(kwCount>=2&&kwCount<=12),true,'Keyword in 2–12 paragraphs, used naturally',kwCount+' now'),
      check(words>=600,true,'600+ words for a competitive topic',words+' words'),
      check(h2s.length>=3,true,'3+ H2 sections',h2s.length+' now'),
      check(links>=2,true,'2+ internal links to Layered pages',links+' now'),
      check(!!f.cover.value.trim()&&!!f.alt.value.trim(),true,'Cover image has alt text (or uses the category image)'),
      check(/frequently asked|faq/i.test(body),true,'Has an FAQ section (captures question searches)'),
      check(f.ex.value.trim().length>=60,true,'Intro / excerpt written')
    ];
    var good=checks.filter(function(c){return c.ok}).length;
    $('seo-score').textContent=good+' of '+checks.length+' checks passing';
    $('seo-checks').innerHTML=checks.map(function(c){
      var cls=c.ok?'ok':(c.warn?'warn':'bad');
      return '<li class="'+cls+'"><span class="dot"></span><span>'+c.label+(c.detail?' <em>('+c.detail+')</em>':'')+'</span></li>';
    }).join('');
  }
  document.getElementById('post-form').addEventListener('input',run); run();
})();`;
