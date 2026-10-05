// lib/components.js — small shared HTML fragments for the SEO pages.
import { esc } from './render.js';

// trail: [{ name, path }], last item is the current page (rendered as text, not a link).
export function breadcrumbNav(trail) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${trail.map((t, i) => (
    i === trail.length - 1
      ? `<li aria-current="page">${esc(t.name)}</li>`
      : `<li><a href="${esc(t.path)}">${esc(t.name)}</a></li>`
  )).join('')}</ol></nav>`;
}

export function faqHtml(faqs, heading = 'Frequently asked questions') {
  if (!faqs || !faqs.length) return '';
  return `<section class="faq"><h2>${esc(heading)}</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`;
}

export function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
