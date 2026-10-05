// routes/articles.js — firms draft and submit articles; admins approve or return them.
// Statuses on posts written by firms: firm_draft -> submitted -> published (or back to firm_draft with a note).
import { db } from '../db.js';
import { esc } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { wordCount } from '../lib/markdown.js';
import { BLOG_CATEGORIES } from '../content/blog-meta.js';
import { dashLayout } from './dashboard.js';
import { uniqueSlug } from './blogAdmin.js';

export const MIN_WORDS = 500;
export const MAX_PENDING = 3;
const redirect = (res, to) => { res.writeHead(302, { Location: to }); res.end(); };
const msg = (path, kind, text) => `${path}?${kind}=${encodeURIComponent(text)}`;
const clean = (v, max) => String(v || '').replace(/\r/g, '').trim().slice(0, max);
const LABEL = { firm_draft: 'Draft', submitted: 'With the editor', published: 'Published', draft: 'With the editor', rejected: 'Not published' };
const EDITABLE = new Set(['firm_draft']);

// Pure rules so they can be tested without the server.
export function submissionProblems({ title, excerpt, body }) {
  const problems = [];
  if (!title) problems.push('Add a title.');
  if (!excerpt || excerpt.length < 40) problems.push('Write a short intro (at least 40 characters).');
  const words = wordCount(String(body || '').split(/\s+/).join(' '));
  if (words < MIN_WORDS) problems.push(`The article needs at least ${MIN_WORDS} words (it has ${words}).`);
  return problems;
}

export async function articlesList(req, res, ctx) {
  const b = ctx.business;
  const posts = db.prepare('SELECT * FROM posts WHERE author_business_id = ? ORDER BY updated_at DESC').all(b.id);
  const inner = `
    <div class="head-row"><h1>Articles</h1><a class="btn btn-sm" href="/dashboard/articles/new">Write an article</a></div>
    <p class="muted">Share useful, original advice for homeowners. Articles are read by Layered's editor before they are published on the blog with your firm's name and a link to your profile.</p>
    <div class="dash-card">
      ${posts.length ? `<table class="data-table"><thead><tr><th>Title</th><th>Status</th><th></th></tr></thead><tbody>
      ${posts.map((p) => `<tr><td><strong>${esc(p.title)}</strong>${p.review_note && p.status === 'firm_draft' ? `<br><span class="small"><b>Editor's note:</b> ${esc(p.review_note)}</span>` : ''}</td>
        <td><span class="status-pill status-${p.status === 'published' ? 'won' : 'contacted'}">${esc(LABEL[p.status] || p.status)}</span></td>
        <td class="actions-row">${EDITABLE.has(p.status) ? `<a class="btn btn-sm btn-outline" href="/dashboard/articles/${p.id}/edit">Edit</a>
          <form method="post" action="/dashboard/articles/${p.id}/delete" class="inline"><button class="btn btn-sm btn-outline" type="submit">Delete</button></form>` : ''}
          ${p.status === 'published' ? `<a class="btn btn-sm btn-outline" href="/blog/${esc(p.slug)}" target="_blank">View</a>` : ''}</td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">No articles yet. A good first one: what you wish homeowners knew before they hired you.</p>'}
    </div>`;
  res.end(dashLayout('/dashboard/articles', inner, ctx));
}

export async function articleEditor(req, res, ctx, id) {
  const p = id ? db.prepare('SELECT * FROM posts WHERE id = ? AND author_business_id = ?').get(id, ctx.business.id) : null;
  if (id && !p) return redirect(res, msg('/dashboard/articles', 'err', 'Article not found.'));
  if (p && !EDITABLE.has(p.status)) return redirect(res, msg('/dashboard/articles', 'err', 'This article is with the editor and cannot be changed now.'));
  const v = p || { title: '', excerpt: '', body: '', category: BLOG_CATEGORIES[0].name, focus_keyword: '', review_note: '' };
  const inner = `
    <p><a href="/dashboard/articles">← Back to articles</a></p>
    <div class="dash-card">
      <h1 style="margin-top:0;">${p ? 'Edit article' : 'New article'}</h1>
      ${v.review_note ? `<p class="notice"><strong>Editor's note:</strong> ${esc(v.review_note)}</p>` : ''}
      <details open><summary><strong>What we publish</strong></summary>
        <ul class="small"><li>Original, practical advice for Singapore homeowners (at least ${MIN_WORDS} words). Written by you, not copied.</li>
        <li>Explain how things work and what to check. Do not make it an advert for your firm; one short mention of who you are is fine.</li>
        <li>Back any prices, rules or timelines with a source. Say "from our projects" for your own figures.</li>
        <li>Links open with <code>nofollow</code> and images are not included. Layered's editor may edit or decline an article.</li></ul></details>
      <form method="post" action="/dashboard/articles/save">
        <input type="hidden" name="id" value="${p ? p.id : ''}">
        <div class="field"><label for="a-title">Title</label><input id="a-title" type="text" name="title" value="${esc(v.title)}" maxlength="120" required></div>
        <div class="two-col">
          <div class="field"><label for="a-cat">Category</label><select id="a-cat" name="category">${BLOG_CATEGORIES.map((c) => `<option${c.name === v.category ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="a-kw">Topic keyword (optional)</label><input id="a-kw" type="text" name="focus_keyword" value="${esc(v.focus_keyword)}" maxlength="80" placeholder="e.g. hdb kitchen renovation cost"></div>
        </div>
        <div class="field"><label for="a-ex">Intro</label><textarea id="a-ex" name="excerpt" rows="3" maxlength="300">${esc(v.excerpt)}</textarea><p class="hint">One or two sentences shown under the title.</p></div>
        <div class="field"><label for="a-body">Article (Markdown: ## headings, - lists, **bold**)</label><textarea id="a-body" name="body" rows="24" class="mono">${esc(v.body)}</textarea></div>
        <div class="actions-row">
          <button class="btn btn-outline" type="submit" name="intent" value="save">Save draft</button>
          <button class="btn" type="submit" name="intent" value="submit">Submit for review</button>
        </div>
      </form>
    </div>`;
  res.end(dashLayout('/dashboard/articles', inner, ctx));
}

export async function articleSave(req, res, ctx, fields) {
  const b = ctx.business;
  const id = parseInt(fields.id, 10) || 0;
  const existing = id ? db.prepare('SELECT * FROM posts WHERE id = ? AND author_business_id = ?').get(id, b.id) : null;
  if (id && !existing) return redirect(res, msg('/dashboard/articles', 'err', 'Article not found.'));
  if (existing && !EDITABLE.has(existing.status)) return redirect(res, msg('/dashboard/articles', 'err', 'This article is with the editor and cannot be changed now.'));

  const row = {
    title: clean(fields.title, 120),
    excerpt: clean(fields.excerpt, 300),
    body: clean(fields.body, 40000),
    category: BLOG_CATEGORIES.some((c) => c.name === fields.category) ? fields.category : BLOG_CATEGORIES[0].name,
    focus_keyword: clean(fields.focus_keyword, 80),
  };
  const editPath = existing ? `/dashboard/articles/${existing.id}/edit` : '/dashboard/articles/new';
  if (!row.title) return redirect(res, msg(editPath, 'err', 'A title is required.'));

  const submit = fields.intent === 'submit';
  if (submit) {
    const problems = submissionProblems(row);
    if (problems.length) return redirect(res, msg(editPath, 'err', problems.join(' ')));
    const pending = db.prepare("SELECT COUNT(*) c FROM posts WHERE author_business_id = ? AND status = 'submitted' AND id != ?").get(b.id, existing ? existing.id : 0).c;
    if (pending >= MAX_PENDING) return redirect(res, msg(editPath, 'err', `You already have ${MAX_PENDING} articles waiting for review. Wait for the editor before sending more.`));
  }
  const status = submit ? 'submitted' : 'firm_draft';
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let postId;
  if (existing) {
    db.prepare("UPDATE posts SET title=?, excerpt=?, body=?, category=?, focus_keyword=?, status=?, review_note='', updated_at=? WHERE id=?")
      .run(row.title, row.excerpt, row.body, row.category, row.focus_keyword, status, now, existing.id);
    postId = existing.id;
  } else {
    const info = db.prepare("INSERT INTO posts (slug, title, excerpt, body, category, focus_keyword, author_name, author_business_id, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .run(uniqueSlug(row.title), row.title, row.excerpt, row.body, row.category, row.focus_keyword, b.company_name, b.id, status, now, now);
    postId = info.lastInsertRowid;
  }
  if (submit) return redirect(res, msg('/dashboard/articles', 'ok', 'Submitted. Layered will read it and publish it or send notes back.'));
  redirect(res, msg(`/dashboard/articles/${postId}/edit`, 'ok', 'Draft saved.'));
}

export async function articleDelete(req, res, ctx, id) {
  db.prepare("DELETE FROM posts WHERE id = ? AND author_business_id = ? AND status = 'firm_draft'").run(id, ctx.business.id);
  redirect(res, msg('/dashboard/articles', 'ok', 'Draft deleted.'));
}

// Admin: approve (publish) or return a submitted article.
export async function articleReview(req, res, ctx, id, action, fields) {
  if (!isAdmin(ctx.business)) { res.statusCode = 403; return res.end(dashLayout('/dashboard/articles', '<h1>Not allowed</h1><p class="muted">Only admins can review submissions.</p>', ctx)); }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (action === 'approve') {
    db.prepare("UPDATE posts SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ?, review_note = '' WHERE id = ? AND status = 'submitted' AND author_business_id > 0").run(now, now, id);
    return redirect(res, msg('/dashboard/blog', 'ok', 'Article published.'));
  }
  db.prepare("UPDATE posts SET status = 'firm_draft', review_note = ?, updated_at = ? WHERE id = ? AND status = 'submitted' AND author_business_id > 0").run(clean(fields.note, 400), now, id);
  redirect(res, msg('/dashboard/blog', 'ok', 'Returned to the firm.'));
}
