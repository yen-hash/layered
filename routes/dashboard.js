import fs from 'node:fs';
import { validCategory } from '../content/trades.js';
import { categorySelect } from './auth.js';
import path from 'node:path';
import { db, PROPERTY_TYPES, STYLES } from '../db.js';
import { uploadFileFor } from '../lib/paths.js';
import { esc, layout, placeholderIllustration } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { visibleLead, trialEnd } from '../lib/leadAccess.js';
import { CASETRUST_OPTIONS, normaliseCaseTrust, normaliseHdbLicence } from '../lib/credentials.js';

export function dashLayout(active, inner, ctx) {
  const links = [
    ['/dashboard', 'Overview'],
    ['/dashboard/leads', 'Leads'],
    ['/dashboard/projects', 'Projects'],
    ['/dashboard/articles', 'Articles'],
    ['/dashboard/profile', 'Business Profile'],
    ...(isAdmin(ctx.business) ? [['/dashboard/blog', 'Blog (admin)'], ['/dashboard/verification', 'Verify credentials'], ['/dashboard/accounts', 'Accounts (admin)'], ['/dashboard/reviews', 'Reviews (admin)']] : []),
  ];
  const nav = links.map(([href, label]) => `<a href="${href}" class="${active === href ? 'active' : ''}">${esc(label)}</a>`).join('');
  const body = `
  <section class="wrap">
    <div class="dash-layout">
      <nav class="dash-nav">${nav}</nav>
      <div>${inner}</div>
    </div>
  </section>`;
  return layout({ title: 'Business dashboard', noindex: true, body, business: ctx.business, flash: ctx.flash });
}

export async function dashboardHome(req, res, ctx) {
  const b = ctx.business;
  const leadCount = db.prepare('SELECT COUNT(*) c FROM lead_matches WHERE business_id = ?').get(b.id).c;
  const newCount = db.prepare("SELECT COUNT(*) c FROM lead_matches WHERE business_id = ? AND status = 'new'").get(b.id).c;
  const projectCount = db.prepare('SELECT COUNT(*) c FROM projects WHERE business_id = ?').get(b.id).c;
  const recentLeadsRaw = db.prepare(`SELECT l.*, lm.status, lm.unlocked_at, lm.id as match_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.business_id = ? ORDER BY lm.created_at DESC LIMIT 5`).all(b.id);

  const recentLeads = recentLeadsRaw.map((l) => visibleLead(l, b, l));
  const inner = `
    <h1>Welcome back, ${esc(b.company_name)}</h1>
    ${accessBanner(b)}
    <div class="kpi-row">
      <div class="kpi"><b>${leadCount}</b><span>Total leads received</span></div>
      <div class="kpi"><b>${newCount}</b><span>New / unread leads</span></div>
      <div class="kpi"><b>${projectCount}</b><span>Projects on your profile</span></div>
    </div>
    <div class="dash-card">
      <h2 style="margin-top:0;">Recent leads</h2>
      ${recentLeads.length ? `
      <table class="data-table">
        <thead><tr><th>Homeowner</th><th>Property</th><th>Budget</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${recentLeads.map((l) => `<tr>
            <td>${esc(l.name)}</td>
            <td>${esc(l.property_type || '-')}</td>
            <td>${esc(l.budget_range || '-')}</td>
            <td><span class="status-pill status-${esc(l.status)}">${esc(l.status)}</span></td>
            <td><a href="/dashboard/leads/${l.match_id}">View</a></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="empty-state">No leads yet. Make sure your profile and projects are filled in — matched homeowners will show up here.</div>`}
    </div>
    <p><a href="/designers/${esc(b.slug)}" target="_blank">View your public profile →</a></p>
  `;
  res.end(dashLayout('/dashboard', inner, ctx));
}

// ---------- Profile ----------

function chipGroup(name, options, checkedList) {
  return `<div class="chip-group">${options.map((o) => `
    <label><input type="checkbox" name="${name}" value="${esc(o)}" ${checkedList.includes(o) ? 'checked' : ''}> ${esc(o)}</label>
  `).join('')}</div>`;
}

export async function profilePage(req, res, ctx) {
  const b = ctx.business;
  const propertyTypes = (b.property_types || '').split(',').filter(Boolean);
  const styles = (b.styles || '').split(',').filter(Boolean);
  const inner = `
    <h1>Business profile</h1>
    <form class="panel wide" method="post" action="/dashboard/profile" enctype="multipart/form-data">
      <div class="two-col">
        <div class="field"><label>Company name</label><input type="text" name="company_name" value="${esc(b.company_name)}" required></div>
        <div class="field"><label>Contact name</label><input type="text" name="contact_name" value="${esc(b.contact_name || '')}"></div>
      </div>
      <div class="two-col">
        <div class="field"><label>Phone</label><input type="tel" name="phone" value="${esc(b.phone || '')}"></div>
        <div class="field"><label>Service areas</label><input type="text" name="service_areas" value="${esc(b.service_areas || '')}"></div>
      </div>
      <div class="field"><label for="logo_file">Logo</label>
        ${b.logo_url ? `<p><img src="${esc(b.logo_url)}" alt="Current logo" width="72" height="72" style="object-fit:contain;border:1px solid var(--line);border-radius:12px;background:#fff;"></p>` : ''}
        <input id="logo_file" type="file" name="logo_file" accept="image/jpeg,image/png,image/webp,image/gif"><p class="hint">JPG, PNG, WebP or GIF under 8MB. A square image works best.</p></div>
      <div class="field"><label for="logo_url">Or a logo image URL</label><input id="logo_url" type="url" name="logo_url" value="${esc(b.logo_url || '')}" placeholder="https://..."></div>
      <div class="field"><label for="category">Type of business</label>${categorySelect(b.category)}<p class="hint">Decides where your profile is listed and which enquiries you receive.</p></div>
      <div class="field"><label>Bio</label><textarea name="bio">${esc(b.bio || '')}</textarea></div>
      <div class="field"><label>Property types you take on</label>${chipGroup('property_types', PROPERTY_TYPES, propertyTypes)}</div>
      <div class="field"><label>Styles you specialize in <span class="muted small">(interior designers)</span></label>${chipGroup('styles', STYLES, styles)}</div>
      <h3>Credentials</h3>
      <p class="muted small" style="margin-top:-6px;">Shown as badges on your public profile. They are labelled self-declared until Layered has checked them against the official HDB and CaseTrust lookups, so only list what you currently hold. If you change a number or tier that was verified, the verified mark is removed until it is checked again.</p>
      <div class="two-col">
        <div class="field"><label>HDB renovation contractor licence no.</label><input type="text" name="hdb_licence_no" value="${esc(b.hdb_licence_no || '')}" maxlength="30" placeholder="As shown in HDB's Directory of Renovation Contractors"></div>
        <div class="field"><label>CaseTrust accreditation</label>
          <select name="casetrust">
            ${CASETRUST_OPTIONS.map((o) => `<option value="${esc(o.value)}" ${o.value === (b.casetrust || '') ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
          </select>
        </div>
      </div>
      <h3>Lead notifications</h3>
      <div class="field checkbox-row"><input type="checkbox" name="notify_email" id="notify_email" ${b.notify_email ? 'checked' : ''}><label for="notify_email" style="margin:0;">Email me new leads (to ${esc(b.email)})</label></div>
      <div class="field checkbox-row"><input type="checkbox" name="notify_sms" id="notify_sms" ${b.notify_sms ? 'checked' : ''}><label for="notify_sms" style="margin:0;">WhatsApp/SMS me new leads</label></div>
      <div class="field"><label>WhatsApp/SMS number</label><input type="tel" name="notify_phone" value="${esc(b.notify_phone || '')}" placeholder="+65 9xxx xxxx"></div>
      <button class="btn" type="submit">Save changes</button>
    </form>
  `;
  res.end(dashLayout('/dashboard/profile', inner, ctx));
}

export async function profileSubmit(req, res, ctx, fields, files = {}) {
  const hdb = normaliseHdbLicence(fields.hdb_licence_no);
  if (hdb.error) {
    res.writeHead(302, { Location: '/dashboard/profile?err=' + encodeURIComponent(hdb.error) });
    res.end();
    return;
  }
  const propertyTypes = Array.isArray(fields.property_types) ? fields.property_types : (fields.property_types ? [fields.property_types] : []);
  const styles = Array.isArray(fields.styles) ? fields.styles : (fields.styles ? [fields.styles] : []);
  const logoFile = files.logo_file && files.logo_file[0];
  const typedUrl = String(fields.logo_url || '').trim();
  const logoUrl = logoFile ? logoFile.publicPath : (/^https?:\/\/\S+$/i.test(typedUrl) || typedUrl.startsWith('/uploads/') ? typedUrl : '');
  const oldLogo = ctx.business.logo_url;
  db.prepare(`UPDATE businesses SET company_name=?, contact_name=?, phone=?, service_areas=?, logo_url=?, bio=?, property_types=?, styles=?, notify_email=?, notify_sms=?, notify_phone=?, hdb_licence_no=?, casetrust=?, category=? WHERE id=?`)
    .run(
      fields.company_name || ctx.business.company_name,
      fields.contact_name || '', fields.phone || '', fields.service_areas || '', logoUrl, fields.bio || '',
      propertyTypes.join(','), styles.join(','),
      fields.notify_email ? 1 : 0, fields.notify_sms ? 1 : 0, fields.notify_phone || '',
      hdb.value, normaliseCaseTrust(fields.casetrust), validCategory(fields.category),
      ctx.business.id
    );
  if (logoFile && oldLogo !== logoUrl) removeUploads([oldLogo]);
  res.writeHead(302, { Location: '/dashboard/profile?ok=' + encodeURIComponent('Profile updated.') });
  res.end();
}

// ---------- Projects ----------

export async function projectsPage(req, res, ctx) {
  const projects = db.prepare('SELECT * FROM projects WHERE business_id = ? ORDER BY created_at DESC').all(ctx.business.id);
  const inner = `
    <h1>Projects</h1>
    <div class="dash-card">
      <h2 style="margin-top:0;">Add a new project</h2>
      <form class="panel wide" method="post" action="/dashboard/projects" enctype="multipart/form-data">
        <div class="two-col">
          <div class="field"><label>Project title</label><input type="text" name="title" required placeholder="e.g. 4-Room HDB, Punggol"></div>
          <div class="field"><label>Property type</label>
            <select name="property_type"><option value="">-</option>${PROPERTY_TYPES.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
          </div>
        </div>
        <div class="field"><label>Style</label>
          <select name="style"><option value="">-</option>${STYLES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Description</label><textarea name="description"></textarea></div>
        <div class="field"><label for="photos">Project photos</label><input id="photos" type="file" name="photos" data-resize accept="image/jpeg,image/png,image/webp,image/gif" multiple><p class="hint">Up to 12 photos (JPG, PNG, WebP or GIF, 8MB each). The first is the cover.</p></div>
        <div class="field"><label for="cover_image_url">Or a cover image URL</label><input id="cover_image_url" type="url" name="cover_image_url" placeholder="https://..."></div>
        <div class="field"><label for="photo_credit">Photo credit (optional)</label><input id="photo_credit" type="text" name="photo_credit" maxlength="120" placeholder="e.g. Photography by Studio Name"></div>
        <div class="field checkbox-row"><input type="checkbox" name="rights" id="rights" required><label for="rights" style="margin:0;">I own these photos or have permission to publish them on Layered.</label></div>
        <button class="btn" type="submit">Add project</button>
      </form>
    </div>
    <script src="/photos.js" defer></script>
    <div class="project-grid">
      ${projects.map((p) => `
      <div class="card project-card">
        <div class="thumb" style="background-image:url('${esc(p.cover_image || placeholderIllustration(p.id))}')"></div>
        <div class="body">
          <h4>${esc(p.title)}</h4>
          <p class="muted small">${photoCount(p)} photo${photoCount(p) === 1 ? '' : 's'}</p>
          <p><a class="btn btn-sm btn-outline" href="/dashboard/projects/${p.id}/edit">Edit</a></p>
          <div class="tag-row">${[p.property_type, p.style].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <form class="inline" method="post" action="/dashboard/projects/${p.id}/delete" onsubmit="return confirm('Delete this project?')">
            <button class="btn btn-sm btn-outline" type="submit">Delete</button>
          </form>
        </div>
      </div>`).join('') || '<div class="empty-state">No projects yet. Add your first one above to showcase your work.</div>'}
    </div>
  `;
  res.end(dashLayout('/dashboard/projects', inner, ctx));
}

// Deletes files we stored under /uploads (and nothing else), ignoring any that are still referenced elsewhere.
export function removeUploads(paths) {
  for (const rel of paths) {
    const file = uploadFileFor(rel);
    if (!file) continue;
    const used = db.prepare("SELECT 1 FROM projects WHERE cover_image = ? OR images LIKE ? UNION SELECT 1 FROM businesses WHERE logo_url = ?").get(rel, `%${rel}%`, rel);
    if (used) continue;
    try { fs.unlinkSync(file); } catch { /* already gone */ }
  }
}

export const photoList = (p) => {
  try { const v = JSON.parse(p.images || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
};
const photoCount = (p) => (photoList(p).length || (p.cover_image ? 1 : 0));

export async function projectCreate(req, res, ctx, fields, files, rejected = []) {
  const back = (kind, text) => { res.writeHead(302, { Location: `/dashboard/projects?${kind}=` + encodeURIComponent(text) }); res.end(); };
  const title = (fields.title || '').trim().slice(0, 120);
  if (!title) return back('err', 'Project title is required.');
  if (!fields.rights) return back('err', 'Please confirm you own these photos or have permission to publish them.');
  const uploaded = (files.photos || []).map((f) => f.publicPath);
  const legacyCover = files.cover_image && files.cover_image[0] ? [files.cover_image[0].publicPath] : [];
  const photos = [...legacyCover, ...uploaded];
  const url = String(fields.cover_image_url || '').trim();
  const urlOk = /^https?:\/\/[^\s]+$/i.test(url) ? url : '';
  const cover = photos[0] || urlOk;
  if (!cover && rejected.length) return back('err', `Those files were not accepted (${rejected.slice(0, 3).join(', ')}). Use JPG, PNG, WebP or GIF under 8MB.`);

  db.prepare(`INSERT INTO projects (business_id, title, property_type, style, description, cover_image, images, photo_credit, rights_confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
    .run(ctx.business.id, title, fields.property_type || '', fields.style || '', String(fields.description || '').slice(0, 2000), cover, JSON.stringify(photos), String(fields.photo_credit || '').trim().slice(0, 120));

  const note = rejected.length ? ` ${rejected.length} file${rejected.length === 1 ? ' was' : 's were'} skipped (JPG, PNG, WebP or GIF under 8MB only).` : '';
  back('ok', 'Project added.' + note);
}

export async function projectEditPage(req, res, ctx, id) {
  const p = db.prepare('SELECT * FROM projects WHERE id = ? AND business_id = ?').get(id, ctx.business.id);
  if (!p) { res.writeHead(302, { Location: '/dashboard/projects?err=' + encodeURIComponent('Project not found.') }); res.end(); return; }
  const photos = photoList(p).length ? photoList(p) : (p.cover_image ? [p.cover_image] : []);
  const inner = `
    <p><a href="/dashboard/projects">← Back to projects</a></p>
    <script src="/photos.js" defer></script>
    <div class="dash-card">
      <h1 style="margin-top:0;">Edit project</h1>
      <form class="panel wide" method="post" action="/dashboard/projects/${p.id}" enctype="multipart/form-data">
        <div class="two-col">
          <div class="field"><label for="title">Project title</label><input id="title" type="text" name="title" value="${esc(p.title)}" maxlength="120" required></div>
          <div class="field"><label for="property_type">Property type</label>
            <select id="property_type" name="property_type"><option value="">-</option>${PROPERTY_TYPES.map((t) => `<option value="${esc(t)}" ${t === p.property_type ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="style">Style</label>
          <select id="style" name="style"><option value="">-</option>${STYLES.map((t) => `<option value="${esc(t)}" ${t === p.style ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="description">Description</label><textarea id="description" name="description" maxlength="2000">${esc(p.description || '')}</textarea></div>
        ${photos.length ? `<div class="field"><span class="label">Photos</span>
          <div class="edit-photos">${photos.map((u, i) => `
            <figure><img src="${esc(u)}" alt="Photo ${i + 1} of ${esc(p.title)}" loading="lazy" width="160" height="120" onerror="this.style.visibility='hidden'">
              <label class="small"><input type="radio" name="cover" value="${esc(u)}" ${u === p.cover_image || (!p.cover_image && i === 0) ? 'checked' : ''}> Cover</label>
              <label class="small"><input type="checkbox" name="remove" value="${esc(u)}"> Remove</label></figure>`).join('')}</div></div>` : ''}
        <div class="field"><label for="photos">Add more photos</label><input id="photos" type="file" name="photos" data-resize accept="image/jpeg,image/png,image/webp,image/gif" multiple><p class="hint">Up to 12 photos in total.</p></div>
        <div class="field"><label for="photo_credit">Photo credit (optional)</label><input id="photo_credit" type="text" name="photo_credit" maxlength="120" value="${esc(p.photo_credit || '')}"></div>
        <div class="field checkbox-row"><input type="checkbox" name="rights" id="rights"><label for="rights" style="margin:0;">I own any photos I am adding, or have permission to publish them on Layered.</label></div>
        <button class="btn" type="submit">Save changes</button>
      </form>
    </div>`;
  res.end(dashLayout('/dashboard/projects', inner, ctx));
}

export async function projectUpdate(req, res, ctx, id, fields, files, rejected = []) {
  const p = db.prepare('SELECT * FROM projects WHERE id = ? AND business_id = ?').get(id, ctx.business.id);
  const back = (kind, text, to = `/dashboard/projects/${id}/edit`) => { res.writeHead(302, { Location: `${to}?${kind}=` + encodeURIComponent(text) }); res.end(); };
  if (!p) return back('err', 'Project not found.', '/dashboard/projects');
  const title = String(fields.title || '').trim().slice(0, 120);
  if (!title) return back('err', 'Project title is required.');
  const added = (files.photos || []).map((f) => f.publicPath);
  if ((added.length || rejected.length) && !fields.rights) { removeUploads(added); return back('err', 'Please confirm you own the photos you are adding or have permission to publish them.'); }

  const current = photoList(p).length ? photoList(p) : (p.cover_image ? [p.cover_image] : []);
  const toRemove = new Set([].concat(fields.remove || []));
  const kept = current.filter((u) => !toRemove.has(u));
  let photos = [...kept, ...added];
  if (photos.length > 12) { removeUploads(added); return back('err', 'A project can have at most 12 photos. Remove some first.'); }
  const wanted = String(fields.cover || '');
  const cover = photos.includes(wanted) ? wanted : (photos[0] || (toRemove.size || added.length ? '' : p.cover_image));
  if (cover) photos = [cover, ...photos.filter((u) => u !== cover)];

  db.prepare(`UPDATE projects SET title=?, property_type=?, style=?, description=?, cover_image=?, images=?, photo_credit=?, rights_confirmed_at=CASE WHEN ? THEN datetime('now') ELSE rights_confirmed_at END WHERE id=?`)
    .run(title, fields.property_type || '', fields.style || '', String(fields.description || '').slice(0, 2000), cover, JSON.stringify(photos), String(fields.photo_credit || '').trim().slice(0, 120), added.length ? 1 : 0, id);
  removeUploads([...toRemove]);
  const skipped = rejected.length ? ` ${rejected.length} file${rejected.length === 1 ? ' was' : 's were'} skipped (JPG, PNG, WebP or GIF under 8MB only).` : '';
  back('ok', 'Project updated.' + skipped);
}

export async function projectDelete(req, res, ctx, projectId) {
  const old = db.prepare('SELECT * FROM projects WHERE id = ? AND business_id = ?').get(projectId, ctx.business.id);
  db.prepare('DELETE FROM projects WHERE id = ? AND business_id = ?').run(projectId, ctx.business.id);
  if (old) removeUploads([old.cover_image, ...photoList(old)]);
  res.writeHead(302, { Location: '/dashboard/projects?ok=' + encodeURIComponent('Project removed.') });
  res.end();
}

// ---------- Leads ----------

const contactMail = () => process.env.CONTACT_EMAIL || '';
function lockedBox() {
  const m = contactMail();
  return `<div class="dash-card" style="border-left:4px solid var(--accent,#c58a00);"><h2 style="margin-top:0;">Contact details are hidden</h2>
    <p>You can see this homeowner's project, but their name, phone and email are hidden on your current plan. Take a subscription to see every lead, or ask us to unlock just this one${m ? `: email <a href="mailto:${esc(m)}?subject=Unlock%20a%20lead">${esc(m)}</a>` : ''}.</p></div>`;
}
function accessBanner(b) {
  if (b.plan === 'paid') return '';
  const end = trialEnd(b);
  if (end.getTime() > Date.now()) return `<div class="dash-card"><p style="margin:0;"><strong>Free trial:</strong> you see homeowners' full contact details until ${esc(end.toISOString().slice(0, 10))}. After that, contact details are hidden unless you subscribe or unlock a lead.</p></div>`;
  return lockedBox();
}

export async function leadsPage(req, res, ctx) {
  const leads = db.prepare(`SELECT l.*, lm.status, lm.unlocked_at, lm.id as match_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.business_id = ? ORDER BY lm.created_at DESC`).all(ctx.business.id).map((l) => visibleLead(l, ctx.business, l));
  const inner = `
    <h1>Leads</h1>
    ${accessBanner(ctx.business)}
    ${leads.length ? `
    <table class="data-table">
      <thead><tr><th>Date</th><th>Homeowner</th><th>Property</th><th>Budget</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${leads.map((l) => `<tr>
          <td>${esc(l.created_at)}</td>
          <td>${esc(l.name)}</td>
          <td>${esc(l.property_type || '-')}</td>
          <td>${esc(l.budget_range || '-')}</td>
          <td><span class="status-pill status-${esc(l.status)}">${esc(l.status)}</span></td>
          <td><a href="/dashboard/leads/${l.match_id}">View</a></td>
        </tr>`).join('')}
      </tbody>
    </table>` : `<div class="empty-state">No leads yet. They'll appear here as soon as a matching homeowner submits a request.</div>`}
  `;
  res.end(dashLayout('/dashboard/leads', inner, ctx));
}

function reviewBlock(row, ctx) {
  const rv = db.prepare('SELECT status FROM reviews WHERE lead_id = ? AND business_id = ?').get(row.lead_id, ctx.business.id);
  const intro = '<h3>Review</h3>';
  if (rv) {
    const label = { invited: 'Invitation emailed. Waiting for the homeowner.', pending: 'Review received. Waiting for Layered to read it.', published: 'Review published on your profile.', rejected: 'Review was not published.' }[rv.status];
    return `${intro}<p>${esc(label)}</p>`;
  }
  if (row.status !== 'won') return `${intro}<p class="muted">Once this enquiry is marked <b>won</b>, you can ask Layered to invite the homeowner to review you.</p>`;
  return `${intro}<p>Layered will email the homeowner a one-time review link. You will not see the link or the review before it is published, and every review is read by Layered first, good or bad.</p>
      <form method="post" action="/dashboard/leads/${row.match_id}/review-invite"><button class="btn btn-sm" type="submit">Invite homeowner to review</button></form>`;
}

export async function leadDetailPage(req, res, ctx, matchId) {
  const raw = db.prepare(`SELECT l.*, lm.status, lm.unlocked_at, lm.id as match_id, lm.lead_id AS lead_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.id = ? AND lm.business_id = ?`).get(matchId, ctx.business.id);
  const row = raw && visibleLead(raw, ctx.business, raw);
  if (!row) { res.statusCode = 404; res.end(dashLayout('/dashboard/leads', '<p>Lead not found.</p>', ctx)); return; }

  const statuses = ['new', 'contacted', 'won', 'lost'];
  const inner = `
    <p><a href="/dashboard/leads">← Back to leads</a></p>
    ${row.masked ? lockedBox() : ''}
    <div class="dash-card">
      <h1 style="margin-top:0;">${esc(row.name)}</h1>
      <span class="status-pill status-${esc(row.status)}">${esc(row.status)}</span>
      <table class="data-table" style="margin-top:16px;">
        <tbody>
          <tr><th>Email</th><td>${row.masked ? esc(row.email) : `<a href="mailto:${esc(row.email)}">${esc(row.email)}</a>`}</td></tr>
          <tr><th>Phone</th><td>${row.masked ? esc(row.phone || '-') : row.phone ? `<a href="tel:${esc(row.phone)}">${esc(row.phone)}</a>` : '-'}</td></tr>
          <tr><th>Property type</th><td>${esc(row.property_type || '-')}</td></tr>
          <tr><th>Style</th><td>${esc(row.style || '-')}</td></tr>
          <tr><th>Budget</th><td>${esc(row.budget_range || '-')}</td></tr>
          <tr><th>Location</th><td>${esc(row.location || '-')}</td></tr>
          <tr><th>Submitted</th><td>${esc(row.created_at)}</td></tr>
        </tbody>
      </table>
      <h3>Message</h3>
      <p>${esc(row.message) || '<span class="muted">No message provided.</span>'}</p>
      ${reviewBlock(row, ctx)}
      <h3>Update status</h3>
      <form method="post" action="/dashboard/leads/${row.match_id}/status">
        <div class="two-col">
          <div class="field">
            <select name="status">${statuses.map((s) => `<option value="${s}" ${s === row.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
          </div>
          <div class="field"><button class="btn" type="submit">Update</button></div>
        </div>
      </form>
    </div>
  `;
  res.end(dashLayout('/dashboard/leads', inner, ctx));
}

export async function leadStatusUpdate(req, res, ctx, matchId, fields) {
  const status = ['new', 'contacted', 'won', 'lost'].includes(fields.status) ? fields.status : 'new';
  db.prepare('UPDATE lead_matches SET status = ? WHERE id = ? AND business_id = ?').run(status, matchId, ctx.business.id);
  res.writeHead(302, { Location: `/dashboard/leads/${matchId}?ok=` + encodeURIComponent('Status updated.') });
  res.end();
}
