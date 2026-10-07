// public/planner.js — the room planner. Reads window.PLANNER (catalogue, layouts) and the global
// planQuantities() that the page inlines from content/planner.js. Plans are stored only in this browser.
(function () {
  'use strict';
  var P = window.PLANNER;
  if (!P) return;
  var NS = 'http://www.w3.org/2000/svg';
  var STORE = 'layered-room-plan';
  var SNAP = 0.05;
  var $ = function (id) { return document.getElementById(id); };
  var svg = $('pl-svg');
  var plan = null, sel = null, drag = null, bg = { url: '', width: 10, opacity: 0.5 };
  var nextId = 1;

  var round = function (v) { return Math.round(v / SNAP) * SNAP; };
  var fix = function (v) { return Math.round(v * 100) / 100; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function withIds(p) {
    p.rooms.forEach(function (r) { r.id = 'r' + nextId++; });
    p.items.forEach(function (i) { i.id = 'i' + nextId++; });
    return p;
  }
  function load(key) {
    var l = P.layouts[key] || P.layouts.blank;
    plan = withIds({ home: key, rooms: clone(l.rooms), items: clone(l.items) });
    sel = null; save(); draw(); fit();
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(plan)); } catch (e) { /* storage blocked: plan still works this visit */ }
  }
  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s && Array.isArray(s.rooms) && Array.isArray(s.items)) {
        s.rooms = s.rooms.filter(function (r) { return P.roomTypes[r.type]; });
        s.items = s.items.filter(function (i) { return P.catalog[i.kind]; });
        plan = withIds(s);
        return true;
      }
    } catch (e) { /* ignore a corrupt or blocked store */ }
    return false;
  }

  function find(id) {
    if (!id) return null;
    var list = id[0] === 'r' ? plan.rooms : plan.items;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // ----- drawing -----
  function bounds() {
    var xs = [0], ys = [0], xe = [6], ye = [4];
    plan.rooms.concat(plan.items).forEach(function (o) { xs.push(o.x); ys.push(o.y); xe.push(o.x + o.w); ye.push(o.y + o.h); });
    if (bg.url) { xe.push(bg.width); ye.push(bg.width * (bg.ratio || 0.7)); }
    return { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys), x2: Math.max.apply(null, xe), y2: Math.max.apply(null, ye) };
  }
  var view = null;
  function fit() {
    var b = bounds(), pad = 0.8;
    view = { x: b.x - pad, y: b.y - pad, w: b.x2 - b.x + pad * 2, h: b.y2 - b.y + pad * 2 };
    applyView();
  }
  function applyView() { svg.setAttribute('viewBox', [view.x, view.y, view.w, view.h].map(fix).join(' ')); }
  function zoom(f) {
    var cx = view.x + view.w / 2, cy = view.y + view.h / 2;
    view.w = Math.min(60, Math.max(2, view.w * f)); view.h = Math.min(60, Math.max(2, view.h * f));
    view.x = cx - view.w / 2; view.y = cy - view.h / 2; applyView();
  }

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id: 'pl-grid', width: 0.5, height: 0.5, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M 0.5 0 L 0 0 0 0.5', fill: 'none', class: 'pl-gridline' }, pat);
    el('rect', { x: -50, y: -50, width: 100, height: 100, fill: 'url(#pl-grid)' }, svg);
    if (bg.url) el('image', { href: bg.url, x: 0, y: 0, width: bg.width, opacity: bg.opacity, preserveAspectRatio: 'xMinYMin meet' }, svg);

    plan.rooms.forEach(function (r) {
      var g = el('g', { class: 'pl-room pl-' + r.type + (sel === r.id ? ' is-sel' : ''), 'data-id': r.id }, svg);
      el('rect', { x: r.x, y: r.y, width: r.w, height: r.h }, g);
      var t = el('text', { x: r.x + r.w / 2, y: r.y + r.h / 2 - 0.08, 'text-anchor': 'middle' }, g);
      t.textContent = r.name;
      var a = el('text', { x: r.x + r.w / 2, y: r.y + r.h / 2 + 0.28, 'text-anchor': 'middle', class: 'pl-dim' }, g);
      a.textContent = fix(r.w) + ' × ' + fix(r.h) + ' m';
      if (sel === r.id) el('rect', { x: r.x + r.w - 0.22, y: r.y + r.h - 0.22, width: 0.22, height: 0.22, class: 'pl-handle', 'data-handle': r.id }, g);
    });
    plan.items.forEach(function (it) {
      var c = P.catalog[it.kind];
      var g = el('g', { class: 'pl-item' + (c.built ? ' is-built' : '') + (c.wall ? ' is-wall' : '') + (sel === it.id ? ' is-sel' : ''), 'data-id': it.id }, svg);
      el('rect', { x: it.x, y: it.y, width: it.w, height: it.h }, g);
      var vertical = it.h > it.w;
      var t = el('text', { x: it.x + it.w / 2, y: it.y + it.h / 2 + 0.06, 'text-anchor': 'middle', class: 'pl-itemlabel' }, g);
      if (vertical) t.setAttribute('transform', 'rotate(-90 ' + fix(it.x + it.w / 2) + ' ' + fix(it.y + it.h / 2) + ')');
      t.textContent = c.label;
      if (sel === it.id) el('rect', { x: it.x + it.w - 0.16, y: it.y + it.h - 0.16, width: 0.16, height: 0.16, class: 'pl-handle', 'data-handle': it.id }, g);
    });
    panel(); summary();
  }

  // ----- selection panel -----
  function panel() {
    var box = $('pl-panel'), o = find(sel);
    if (!o) { box.innerHTML = '<p class="muted small">Select a room or item on the plan to edit it. Drag to move, drag the corner square to resize.</p>'; return; }
    var isRoom = sel[0] === 'r';
    var html = '';
    if (isRoom) {
      html += '<div class="field"><label for="pl-name">Room name</label><input id="pl-name" type="text" maxlength="40" value="' + esc(o.name) + '"></div>';
      html += '<div class="field"><label for="pl-type">Room type</label><select id="pl-type">' + Object.keys(P.roomTypes).map(function (k) { return '<option value="' + k + '"' + (k === o.type ? ' selected' : '') + '>' + esc(P.roomTypes[k].label) + '</option>'; }).join('') + '</select></div>';
    } else {
      html += '<p><strong>' + esc(P.catalog[o.kind].label) + '</strong>' + (P.catalog[o.kind].built ? ' <span class="muted small">(built-in, priced)</span>' : '') + '</p>';
    }
    html += '<div class="pl-dims"><div class="field"><label for="pl-w">Width (m)</label><input id="pl-w" type="number" min="0.2" max="30" step="0.05" value="' + fix(o.w) + '"></div>'
      + '<div class="field"><label for="pl-h">' + (isRoom ? 'Length' : 'Depth') + ' (m)</label><input id="pl-h" type="number" min="0.2" max="30" step="0.05" value="' + fix(o.h) + '"></div></div>';
    html += '<p class="pl-actions">' + (isRoom ? '' : '<button type="button" class="btn btn-sm btn-outline" id="pl-rot">Rotate</button> ') + '<button type="button" class="btn btn-sm btn-outline" id="pl-dup">Duplicate</button> <button type="button" class="btn btn-sm btn-outline pl-del" id="pl-del">Delete</button></p>';
    box.innerHTML = html;
    var setNum = function (k) { return function (e) { var v = Number(e.target.value); if (v >= 0.2 && v <= 30) { o[k] = fix(v); save(); redrawKeepPanel(); } }; };
    $('pl-w').addEventListener('input', setNum('w'));
    $('pl-h').addEventListener('input', setNum('h'));
    if (isRoom) {
      $('pl-name').addEventListener('input', function (e) { o.name = e.target.value.slice(0, 40); save(); redrawKeepPanel(); });
      $('pl-type').addEventListener('change', function (e) { o.type = e.target.value; save(); draw(); });
    } else {
      $('pl-rot').addEventListener('click', function () { var w = o.w; o.w = o.h; o.h = w; save(); draw(); });
    }
    $('pl-dup').addEventListener('click', function () { var c = clone(o); c.id = sel[0] + nextId++; c.x = fix(c.x + 0.3); c.y = fix(c.y + 0.3); (isRoom ? plan.rooms : plan.items).push(c); sel = c.id; save(); draw(); });
    $('pl-del').addEventListener('click', remove);
  }
  // Redraw the plan but leave the form alone so typing is not interrupted.
  function redrawKeepPanel() { var p = panel; panel = function () {}; draw(); panel = p; }
  function remove() {
    if (!sel) return;
    plan.rooms = plan.rooms.filter(function (r) { return r.id !== sel; });
    plan.items = plan.items.filter(function (i) { return i.id !== sel; });
    sel = null; save(); draw();
  }

  // ----- summary and hand-offs -----
  function summary() {
    var q = planQuantities(plan, P.roomTypes, P.catalog);
    var lines = Object.keys(q.qty).filter(function (k) { return k !== 'vinyl'; }).map(function (k) {
      var name = P.qtyLabels[k] || k;
      return '<li><span>' + esc(name) + '</span><span>' + q.qty[k] + (k === 'platformBed' ? '' : ' ft run') + '</span></li>';
    });
    $('pl-summary').innerHTML = '<ul class="est-summary">'
      + '<li><span>Rooms</span><span>' + q.rooms + ' (' + q.bathrooms + ' bathroom' + (q.bathrooms === 1 ? '' : 's') + ')</span></li>'
      + '<li><span>Total room area</span><span>' + q.totalM2 + ' m²</span></li>'
      + '<li><span>Dry floor area (for flooring)</span><span>' + q.drySqft + ' sq ft</span></li>'
      + lines.join('') + '</ul>';
    var home = P.layouts[plan.home] && plan.home !== 'blank' ? plan.home : 'hdb4';
    var qs = Object.keys(q.qty).map(function (k) { return k + ':' + q.qty[k]; });
    if (q.bathrooms) qs.push('bathFittings:' + q.bathrooms);
    $('pl-price').href = '/tools/renovation-cost-estimator#home=' + home + '&q=' + qs.join(',');
    var brief = 'Room plan from the Layered planner: ' + (P.layouts[plan.home] ? P.layouts[plan.home].label : 'custom') + ', '
      + q.rooms + ' rooms, about ' + q.totalM2 + ' m² (' + q.drySqft + ' sq ft of dry floor). Built-ins: '
      + (Object.keys(q.qty).filter(function (k) { return k !== 'vinyl'; }).map(function (k) { return (P.qtyLabels[k] || k) + ' ' + q.qty[k] + (k === 'platformBed' ? '' : ' ft run'); }).join(', ') || 'none yet') + '.';
    var type = home === 'condo' ? 'Condo' : 'HDB';
    $('pl-enquire').href = '/?type=' + type + '&brief=' + encodeURIComponent(brief) + '#get-recommendations';
  }

  // ----- pointer interaction -----
  function pt(e) {
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(m.inverse());
  }
  svg.addEventListener('pointerdown', function (e) {
    var h = e.target.getAttribute && e.target.getAttribute('data-handle');
    var g = e.target.closest && e.target.closest('[data-id]');
    var p = pt(e);
    if (h) { var o = find(h); drag = { mode: 'size', o: o, sx: p.x, sy: p.y, w: o.w, h: o.h }; }
    else if (g) {
      sel = g.getAttribute('data-id'); var o2 = find(sel);
      drag = { mode: 'move', o: o2, sx: p.x, sy: p.y, x: o2.x, y: o2.y };
      draw();
    } else { sel = null; drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; draw(); }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (drag.mode === 'pan') {
      var r = svg.getBoundingClientRect(), s = view.w / r.width;
      view.x = drag.vx - (e.clientX - drag.sx) * s; view.y = drag.vy - (e.clientY - drag.sy) * s; applyView(); return;
    }
    var p = pt(e), dx = p.x - drag.sx, dy = p.y - drag.sy;
    if (drag.mode === 'move') { drag.o.x = fix(round(drag.x + dx)); drag.o.y = fix(round(drag.y + dy)); }
    else { drag.o.w = fix(Math.max(0.2, round(drag.w + dx))); drag.o.h = fix(Math.max(0.2, round(drag.h + dy))); }
    drag.moved = true;
    draw();
  });
  var end = function () { if (drag && drag.moved) save(); drag = null; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!sel || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    var o = find(sel); if (!o) return;
    var step = e.shiftKey ? 0.5 : SNAP, moved = true;
    if (e.key === 'ArrowLeft') o.x = fix(o.x - step);
    else if (e.key === 'ArrowRight') o.x = fix(o.x + step);
    else if (e.key === 'ArrowUp') o.y = fix(o.y - step);
    else if (e.key === 'ArrowDown') o.y = fix(o.y + step);
    else if (e.key === 'Delete' || e.key === 'Backspace') { remove(); e.preventDefault(); return; }
    else moved = false;
    if (moved) { e.preventDefault(); save(); draw(); }
  });

  // ----- toolbar -----
  $('pl-load').addEventListener('click', function () {
    if (plan.rooms.length && !window.confirm('Replace your current plan with a typical layout?')) return;
    load($('pl-home').value);
  });
  $('pl-addroom').addEventListener('click', function () {
    var r = { id: 'r' + nextId++, name: 'New room', type: 'bedroom', x: fix(round(view.x + view.w / 2 - 1.5)), y: fix(round(view.y + view.h / 2 - 1.5)), w: 3, h: 3 };
    plan.rooms.push(r); sel = r.id; save(); draw();
  });
  [].forEach.call(document.querySelectorAll('[data-add]'), function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-add'), c = P.catalog[k];
      var it = { id: 'i' + nextId++, kind: k, x: fix(round(view.x + view.w / 2 - c.w / 2)), y: fix(round(view.y + view.h / 2 - c.h / 2)), w: c.w, h: c.h };
      plan.items.push(it); sel = it.id; save(); draw();
    });
  });
  $('pl-zin').addEventListener('click', function () { zoom(0.8); });
  $('pl-zout').addEventListener('click', function () { zoom(1.25); });
  $('pl-fit').addEventListener('click', fit);
  $('pl-print').addEventListener('click', function () { window.print(); });
  $('pl-download').addEventListener('click', function () {
    var copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', NS);
    var b = bounds(); copy.setAttribute('viewBox', [b.x - 0.5, b.y - 0.5, b.x2 - b.x + 1, b.y2 - b.y + 1].map(fix).join(' '));
    copy.setAttribute('width', Math.round((b.x2 - b.x + 1) * 80)); copy.setAttribute('height', Math.round((b.y2 - b.y + 1) * 80));
    [].forEach.call(copy.querySelectorAll('image,.pl-handle'), function (n) { n.parentNode.removeChild(n); });
    var css = '<style>' + P.svgCss + '</style>';
    var blob = new Blob([copy.outerHTML.replace('>', '>' + css)], { type: 'image/svg+xml' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'room-plan.svg';
    document.body.appendChild(a); a.click(); a.remove();
  });

  // Background floor plan: read locally, never uploaded.
  $('pl-bg').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    if (bg.url) URL.revokeObjectURL(bg.url);
    bg.url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () { bg.ratio = img.naturalHeight / img.naturalWidth; draw(); fit(); };
    img.src = bg.url;
    $('pl-bgopts').hidden = false;
  });
  $('pl-bgw').addEventListener('input', function (e) { var v = Number(e.target.value); if (v >= 2 && v <= 60) { bg.width = v; draw(); } });
  $('pl-bgo').addEventListener('input', function (e) { bg.opacity = Number(e.target.value); draw(); });
  $('pl-bgclear').addEventListener('click', function () { if (bg.url) URL.revokeObjectURL(bg.url); bg.url = ''; $('pl-bg').value = ''; $('pl-bgopts').hidden = true; draw(); });

  if (!restore()) load('hdb4');
  else { $('pl-home').value = P.layouts[plan.home] ? plan.home : 'hdb4'; draw(); fit(); }
})();
