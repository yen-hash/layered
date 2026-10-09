// Developer tool: builds the printable PDFs in public/downloads with the Chromium that Playwright provides.
// Usage: node scripts/dev/build-pdfs.mjs   (the generated PDFs are committed; production never runs this)
// Playwright is a dev-only tool and is not a dependency of this repo; point PLAYWRIGHT_ENTRY at its index.mjs if needed.
const { chromium } = await import(process.env.PLAYWRIGHT_ENTRY || 'playwright');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKLIST } from '../../content/checklist.js';
import { CONTRACT_CHECKLIST as C } from '../../content/contractChecklist.js';
import { RESOURCES_REVIEWED } from '../../content/resources.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'public/downloads');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (html) => esc(String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());
const fonts = ['familjen-grotesk', 'literata'].map(() => '').join('');

const css = `
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.45 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #12211c; margin: 0; }
  h1 { font-size: 21pt; margin: 0 0 4px; color: #0b3a32; letter-spacing: -.01em; }
  h2 { font-size: 13pt; margin: 20px 0 6px; color: #0a7360; border-bottom: 2px solid #f2b21b; padding-bottom: 3px; page-break-after: avoid; }
  h3 { font-size: 10.5pt; margin: 10px 0 3px; }
  .brand { color: #0a7360; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: 9pt; }
  .sub { color: #4b5d56; margin: 0 0 10px; }
  .box { background: #f3f5f1; border: 1px solid #d5dfda; border-radius: 6px; padding: 8px 12px; margin: 10px 0; font-size: 9.5pt; }
  ul.tick { list-style: none; padding: 0; margin: 4px 0; }
  ul.tick li { position: relative; padding: 3px 0 3px 22px; break-inside: avoid; }
  ul.tick li::before { content: ""; position: absolute; left: 0; top: 5px; width: 11px; height: 11px; border: 1.5px solid #0a7360; border-radius: 2px; }
  ul.tick li b { color: #0b3a32; }
  .when { color: #4b5d56; font-size: 9pt; margin: 0 0 4px; }
  .clause { border-left: 3px solid #bfe0d5; background: #fbfcfb; padding: 6px 10px; margin: 8px 0; font-size: 9.5pt; break-inside: avoid; }
  .clause .lab { font-weight: 700; color: #0a7360; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .05em; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 9.5pt; break-inside: avoid; }
  th, td { border: 1px solid #c9d6d0; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #0a7360; color: #fff; }
  td { height: 22px; }
  .foot { margin-top: 18px; color: #4b5d56; font-size: 8.5pt; border-top: 1px solid #d5dfda; padding-top: 6px; }
  .sig { margin-top: 22px; font-size: 9.5pt; line-height: 2.2; }
`;
const shell = (title, inner) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${inner}</body></html>`;
const footer = `<p class="foot">Layered · layeredsg.com/resources · Reviewed ${RESOURCES_REVIEWED}. General information for planning, not legal, financial or professional advice. Rules and figures change, so check the official source before relying on them.</p>`;

const checklistHtml = shell(CHECKLIST.title, `
  <div class="brand">Layered · layeredsg.com</div>
  <h1>${esc(CHECKLIST.h1)}</h1>
  <p class="sub">${plain(CHECKLIST.summary)} Tick each box as you go. The online version, with links, is at layeredsg.com/guides/renovation-checklist-singapore.</p>
  ${CHECKLIST.phases.map((p) => `
    <h2>${esc(p.title)}</h2>
    <p class="when">${esc(p.when || '')}${p.when ? '. ' : ''}${plain(p.intro || '')}</p>
    <ul class="tick">${p.items.map(([, title, detail]) => `<li><b>${plain(title)}</b>${detail ? ' ' + plain(detail) : ''}</li>`).join('')}</ul>`).join('')}
  ${footer}`);

const contractHtml = shell(C.title, `
  <div class="brand">Layered · layeredsg.com</div>
  <h1>${esc(C.title)}</h1>
  <p class="sub">${esc(C.subtitle)}</p>
  <div class="box">${C.notice.map((n) => `<p style="margin:4px 0">${esc(n)}</p>`).join('')}</div>
  ${C.sections.map((s) => `
    <h2>${esc(s.h)}</h2>
    <ul class="tick">${s.check.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <div class="clause"><div class="lab">Sample wording (fill the blanks)</div>${esc(s.clause)}</div>
    ${s.table ? `<table><thead><tr>${s.table[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.slice(1).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}`).join('')}
  <h2>Signatures</h2>
  <p class="sig">${esc(C.signature)}</p>
  <h2>Before you sign</h2>
  <ul class="tick">${C.before.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
  ${footer}`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [file, html] of [['layered-renovation-checklist.pdf', checklistHtml], ['layered-renovation-contract-checklist.pdf', contractHtml]]) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: path.join(out, file), format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#6b7a74">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>', margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
  await page.close();
  console.log('wrote', file, fs.statSync(path.join(out, file)).size, 'bytes');
}
await browser.close();
