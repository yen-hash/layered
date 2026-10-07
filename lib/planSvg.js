// lib/planSvg.js — renders one of the room planner's starter layouts as a static, three-layer drawing for the
// home page hero. Same data as /tools/room-planner, so the picture is the product, not an illustration.
import { LAYOUTS, CATALOG } from '../content/planner.js';
import { esc } from './render.js';

const f = (n) => Math.round(n * 100) / 100;

function door(it) {
  const { x, y, w } = it;
  const cx = x + w / 2, cy = y + w / 2;
  let tf = `rotate(${it.r || 0} ${f(cx)} ${f(cy)})`;
  if (it.m) tf += ` translate(${f(2 * cx)} 0) scale(-1 1)`;
  return `<g transform="${tf}"><rect x="${f(x)}" y="${f(y - 0.095)}" width="${f(w)}" height="0.19" class="pl-gap"/>`
    + `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y + w)}" class="pl-leaf${it.kind === 'mainDoor' ? ' pl-main' : ''}"/>`
    + `<path d="M ${f(x + w)} ${f(y)} A ${f(w)} ${f(w)} 0 0 1 ${f(x)} ${f(y + w)}" class="pl-swing"/></g>`;
}

function windowPane(it) {
  const horiz = it.w >= it.h;
  const gap = horiz ? `<rect x="${f(it.x)}" y="${f(it.y - 0.02)}" width="${f(it.w)}" height="${f(it.h + 0.04)}" class="pl-gap"/>` : `<rect x="${f(it.x - 0.02)}" y="${f(it.y)}" width="${f(it.w + 0.04)}" height="${f(it.h)}" class="pl-gap"/>`;
  const line = horiz
    ? `<line x1="${f(it.x)}" y1="${f(it.y + it.h / 2)}" x2="${f(it.x + it.w)}" y2="${f(it.y + it.h / 2)}" class="pl-glass"/>`
    : `<line x1="${f(it.x + it.w / 2)}" y1="${f(it.y)}" x2="${f(it.x + it.w / 2)}" y2="${f(it.y + it.h)}" class="pl-glass"/>`;
  return `${gap}<rect x="${f(it.x)}" y="${f(it.y)}" width="${f(it.w)}" height="${f(it.h)}" class="pl-win"/>${line}`;
}

export function heroPlanSvg(key = 'hdb4') {
  const L = LAYOUTS[key];
  const maxX = Math.max(...L.rooms.map((r) => r.x + r.w));
  const maxY = Math.max(...L.rooms.map((r) => r.y + r.h));
  const pad = 1.1, tbW = 4.6, tbH = 1.5;
  const vbW = maxX + pad * 2, vbH = maxY + pad * 2 + 0.2;
  const rooms = L.rooms.map((r) => `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" class="plan-wall" pathLength="1"/>`).join('');
  const labels = L.rooms.filter((r) => r.w * r.h > 2.2 && r.name !== 'Corridor').map((r) => `<text x="${f(r.x + r.w / 2)}" y="${f(r.y + r.h / 2 + 0.08)}" text-anchor="middle" class="plan-room">${esc(r.name)}</text>`).join('');
  const open = L.items.filter((i) => CATALOG[i.kind].opening);
  const doors = open.filter((i) => CATALOG[i.kind].opening === 'door').map(door).join('');
  const windows = open.filter((i) => CATALOG[i.kind].opening === 'window').map(windowPane).join('');
  const rect = (i, cls) => `<rect x="${f(i.x)}" y="${f(i.y)}" width="${f(i.w)}" height="${f(i.h)}" class="${cls}"/>`;
  const built = L.items.filter((i) => CATALOG[i.kind].built).map((i) => rect(i, 'plan-built')).join('');
  const loose = L.items.filter((i) => !CATALOG[i.kind].built && !CATALOG[i.kind].opening).map((i) => rect(i, 'plan-loose')).join('');
  const dim = (x1, y1, x2, y2, text, vertical) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const tick = (x, y) => (vertical ? `<line x1="${f(x - 0.18)}" y1="${f(y)}" x2="${f(x + 0.18)}" y2="${f(y)}"/>` : `<line x1="${f(x)}" y1="${f(y - 0.18)}" x2="${f(x)}" y2="${f(y + 0.18)}"/>`);
    return `<g class="plan-dim"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>${tick(x1, y1)}${tick(x2, y2)}`
      + `<text x="${f(mx)}" y="${f(my)}" text-anchor="middle" ${vertical ? `transform="rotate(-90 ${f(mx - 0.22)} ${f(my)})" dx="-0.22"` : 'dy="-0.2"'}>${text}</text></g>`;
  };
  const area = L.rooms.reduce((a, r) => a + r.w * r.h, 0);
  const tx = maxX + pad - tbW - 0.1, ty = maxY + pad - tbH + 0.05;
  // The title block sits in the corner of the sheet, outside the flat.
  const title = `<g class="plan-title" transform="translate(${f(tx)} ${f(ty)})"><rect width="${tbW}" height="${tbH}"/><line x1="0" y1="0.62" x2="${tbW}" y2="0.62"/>`
    + `<text x="0.2" y="0.42" class="plan-title-main">${esc(L.label)}, typical layout</text>`
    + `<text x="0.2" y="1.02">Layers: structure, built-ins, furniture</text><text x="0.2" y="1.32">${esc(String(Math.round(area)))} m² of rooms</text></g>`;
  return `<svg class="plan" viewBox="${f(-pad)} ${f(-pad)} ${f(vbW)} ${f(vbH)}" role="img" aria-label="Floor plan of a typical ${esc(L.label)} with built-in carpentry and furniture, drawn in three layers">`
    + dim(0, -0.55, maxX, -0.55, `${f(maxX)} m`, false) + dim(maxX + 0.55, 0, maxX + 0.55, maxY, `${f(maxY)} m`, true)
    + `<g class="plan-layer" data-layer="structure"><g class="plan-rooms">${rooms}</g>${windows}${doors}</g>`
    + `<g class="plan-layer" data-layer="built">${built}</g><g class="plan-layer" data-layer="loose">${loose}</g>`
    + `<g class="plan-layer plan-labels" data-layer="structure">${labels}</g>${title}</svg>`;
}
