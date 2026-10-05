import { db, PROPERTY_TYPES, STYLES } from '../db.js';
import { esc, layout, placeholderIllustration } from '../lib/render.js';
import { isAdmin } from '../lib/admin.js';
import { CASETRUST_OPTIONS, normaliseCaseTrust, normaliseHdbLicence } from '../lib/credentials.js';

export function dashLayout(active, inner, ctx) {
  const links = [
    ['/dashboard', 'Overview'],
    ['/dashboard/leads', 'Leads'],
    ['/dashboard/projects', 'Projects'],
    ['/dashboard/profile', 'Business Profile'],
    ...(isAdmin(ctx.business) ? [['/dashboard/blog', 'Blog (admin)'], ['/dashboard/verification', 'Verify credentials'], ['/dashboard/reviews', 'Reviews (admin)']] : []),
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
  const recentLeads = db.prepare(`SELECT l.*, lm.status, lm.id as match_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.business_id = ? ORDER BY lm.created_at DESC LIMIT 5`).all(b.id);

  const inner = `
    <h1>Welcome back, ${esc(b.company_name)}</h1>
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
    <form class="panel wide" method="post" action="/dashboard/profile">
      <div class="two-col">
        <div class="field"><label>Company name</label><input type="text" name="company_name" value="${esc(b.company_name)}" required></div>
        <div class="field"><label>Contact name</label><input type="text" name="contact_name" value="${esc(b.contact_name || '')}"></div>
      </div>
      <div class="two-col">
        <div class="field"><label>Phone</label><input type="tel" name="phone" value="${esc(b.phone || '')}"></div>
        <div class="field"><label>Service areas</label><input type="text" name="service_areas" value="${esc(b.service_areas || '')}"></div>
      </div>
      <div class="field"><label>Logo / cover image URL</label><input type="url" name="logo_url" value="${esc(b.logo_url || '')}" placeholder="https://..."></div>
      <div class="field"><label>Bio</label><textarea name="bio">${esc(b.bio || '')}</textarea></div>
      <div class="field"><label>Property types you take on</label>${chipGroup('property_types', PROPERTY_TYPES, propertyTypes)}</div>
      <div class="field"><label>Styles you specialize in</label>${chipGroup('styles', STYLES, styles)}</div>
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

export async function profileSubmit(req, res, ctx, fields) {
  const hdb = normaliseHdbLicence(fields.hdb_licence_no);
  if (hdb.error) {
    res.writeHead(302, { Location: '/dashboard/profile?err=' + encodeURIComponent(hdb.error) });
    res.end();
    return;
  }
  const propertyTypes = Array.isArray(fields.property_types) ? fields.property_types : (fields.property_types ? [fields.property_types] : []);
  const styles = Array.isArray(fields.styles) ? fields.styles : (fields.styles ? [fields.styles] : []);
  db.prepare(`UPDATE businesses SET company_name=?, contact_name=?, phone=?, service_areas=?, logo_url=?, bio=?, property_types=?, styles=?, notify_email=?, notify_sms=?, notify_phone=?, hdb_licence_no=?, casetrust=? WHERE id=?`)
    .run(
      fields.company_name || ctx.business.company_name,
      fields.contact_name || '', fields.phone || '', fields.service_areas || '', fields.logo_url || '', fields.bio || '',
      propertyTypes.join(','), styles.join(','),
      fields.notify_email ? 1 : 0, fields.notify_sms ? 1 : 0, fields.notify_phone || '',
      hdb.value, normaliseCaseTrust(fields.casetrust),
      ctx.business.id
    );
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
        <div class="field"><label>Cover photo</label><input type="file" name="cover_image" accept="image/*"><p class="hint">Or paste an image URL below instead of uploading.</p></div>
        <div class="field"><input type="url" name="cover_image_url" placeholder="https://..."></div>
        <button class="btn" type="submit">Add project</button>
      </form>
    </div>
    <div class="project-grid">
      ${projects.map((p) => `
      <div class="card project-card">
        <div class="thumb" style="background-image:url('${esc(p.cover_image || placeholderIllustration(p.id))}')"></div>
        <div class="body">
          <h4>${esc(p.title)}</h4>
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

export async function projectCreate(req, res, ctx, fields, files) {
  const title = (fields.title || '').trim();
  if (!title) {
    res.writeHead(302, { Location: '/dashboard/projects?err=' + encodeURIComponent('Project title is required.') });
    res.end();
    return;
  }
  const uploaded = files.cover_image && files.cover_image[0];
  const coverImage = uploaded ? uploaded.publicPath : (fields.cover_image_url || '');

  db.prepare(`INSERT INTO projects (business_id, title, property_type, style, description, cover_image, images) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(ctx.business.id, title, fields.property_type || '', fields.style || '', fields.description || '', coverImage, '[]');

  res.writeHead(302, { Location: '/dashboard/projects?ok=' + encodeURIComponent('Project added.') });
  res.end();
}

export async function projectDelete(req, res, ctx, projectId) {
  db.prepare('DELETE FROM projects WHERE id = ? AND business_id = ?').run(projectId, ctx.business.id);
  res.writeHead(302, { Location: '/dashboard/projects?ok=' + encodeURIComponent('Project removed.') });
  res.end();
}

// ---------- Leads ----------

export async function leadsPage(req, res, ctx) {
  const leads = db.prepare(`SELECT l.*, lm.status, lm.id as match_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.business_id = ? ORDER BY lm.created_at DESC`).all(ctx.business.id);
  const inner = `
    <h1>Leads</h1>
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
  const row = db.prepare(`SELECT l.*, lm.status, lm.id as match_id FROM lead_matches lm JOIN leads l ON l.id = lm.lead_id WHERE lm.id = ? AND lm.business_id = ?`).get(matchId, ctx.business.id);
  if (!row) { res.statusCode = 404; res.end(dashLayout('/dashboard/leads', '<p>Lead not found.</p>', ctx)); return; }

  const statuses = ['new', 'contacted', 'won', 'lost'];
  const inner = `
    <p><a href="/dashboard/leads">← Back to leads</a></p>
    <div class="dash-card">
      <h1 style="margin-top:0;">${esc(row.name)}</h1>
      <span class="status-pill status-${esc(row.status)}">${esc(row.status)}</span>
      <table class="data-table" style="margin-top:16px;">
        <tbody>
          <tr><th>Email</th><td><a href="mailto:${esc(row.email)}">${esc(row.email)}</a></td></tr>
          <tr><th>Phone</th><td>${row.phone ? `<a href="tel:${esc(row.phone)}">${esc(row.phone)}</a>` : '-'}</td></tr>
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
