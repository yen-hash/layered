// lib/markdown.js — a small, safe Markdown renderer for blog posts.
//
// Safety model: every piece of author text is HTML-escaped *before* any markup is added, raw HTML
// in the source is never passed through, and link/image URLs are restricted to http(s), mailto and
// site-relative paths. Supports: # ## ### headings, paragraphs, ordered/unordered lists, > quotes,
// --- rules, pipe tables, ![alt](src), [text](href), **bold**, *italic*, `code`.
import { esc } from './render.js';

export const slugify = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

function safeUrl(u) {
  const url = String(u).trim();
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (url.startsWith('#')) return url;
  return '';
}

// Firm-written articles: external links are nofollow/ugc and images are dropped (no tracking pixels or hotlinks).
let FIRM_MODE = false;

function inline(raw) {
  let t = esc(raw);
  // images first so their brackets aren't read as links
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    const u = safeUrl(src.replace(/&amp;/g, '&'));
    return u && !FIRM_MODE ? `<img src="${esc(u)}" alt="${alt}" loading="lazy">` : alt;
  });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    const u = safeUrl(href.replace(/&amp;/g, '&'));
    if (!u) return text;
    const external = /^https?:/i.test(u);
    return `<a href="${esc(u)}"${external ? ` rel="${FIRM_MODE ? 'nofollow ugc noopener noreferrer' : 'noopener noreferrer'}" target="_blank"` : ''}>${text}</a>`;
  });
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return t;
}

const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

// Returns { html, headings: [{ id, text }], text } where text is plain prose (for word counts).
export function renderMarkdown(src = '', opts = {}) {
  FIRM_MODE = Boolean(opts.firm);
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const headings = [];
  const used = new Set();
  let i = 0;

  const idFor = (text) => {
    let id = slugify(text) || 'section';
    let n = 2;
    const base = id;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    let m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m) {
      // The page template renders the title as <h1>; author "#" headings become h2 so there is one h1.
      const level = Math.max(2, m[1].length === 1 ? 2 : m[1].length);
      const text = m[2].trim();
      const id = idFor(text);
      if (level === 2) headings.push({ id, text });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++; continue;
    }
    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${buf.map((l) => `<p>${inline(l)}</p>`).join('')}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
      out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`);
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      out.push(`<div class="table-scroll"><table class="data-table"><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    // paragraph: consume until blank line or a new block starts
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>\s?|---+\s*$|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) { buf.push(lines[i].trim()); i++; }
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  const html = out.join('\n');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return { html, headings, text };
}

export const wordCount = (text) => (text ? text.split(/\s+/).filter(Boolean).length : 0);
export const readingMinutes = (words) => Math.max(1, Math.round(words / 220));
