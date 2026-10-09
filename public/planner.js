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
  var plan = null, sel = null, drag = null, bg = { url: '', width: 10, opacity: 0.5, x: 0, y: 0, rot: 0 }, bgMode = '', cal = [];
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
    if (bg.url) { xs.push(bg.x); ys.push(bg.y); xe.push(bg.x + bg.width); ye.push(bg.y + bg.width * (bg.ratio || 0.7)); }
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
    if (bg.url) el('image', { href: bg.url, x: 0, y: 0, width: bg.width, opacity: bg.opacity, preserveAspectRatio: 'xMinYMin meet', transform: 'translate(' + fix(bg.x) + ' ' + fix(bg.y) + ') rotate(' + bg.rot + ')', class: 'pl-bgimg' }, svg);

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
      if (c.opening) return;
      var g = el('g', { class: 'pl-item' + (c.built ? ' is-built' : '') + (c.wall ? ' is-wall' : '') + (sel === it.id ? ' is-sel' : ''), 'data-id': it.id }, svg);
      el('rect', { x: it.x, y: it.y, width: it.w, height: it.h }, g);
      var vertical = it.h > it.w;
      var t = el('text', { x: it.x + it.w / 2, y: it.y + it.h / 2 + 0.06, 'text-anchor': 'middle', class: 'pl-itemlabel' }, g);
      if (vertical) t.setAttribute('transform', 'rotate(-90 ' + fix(it.x + it.w / 2) + ' ' + fix(it.y + it.h / 2) + ')');
      t.textContent = c.label;
      if (sel === it.id) el('rect', { x: it.x + it.w - 0.16, y: it.y + it.h - 0.16, width: 0.16, height: 0.16, class: 'pl-handle', 'data-handle': it.id }, g);
    });
    plan.items.forEach(function (it) { if (P.catalog[it.kind].opening) drawOpening(it); });
    cal.forEach(function (c) { el('circle', { cx: c.x, cy: c.y, r: 0.1, class: 'pl-calpt' }, svg); });
    if (cal.length === 2) el('line', { x1: cal[0].x, y1: cal[0].y, x2: cal[1].x, y2: cal[1].y, class: 'pl-calline' }, svg);
    panel(); summary();
  }

  // Doors are drawn for a wall along the top of their square, swinging down, then mirrored (m) and
  // rotated (r) into place. Sliding doors and windows sit in the wall along their long side.
  function drawOpening(it) {
    var c = P.catalog[it.kind];
    var g = el('g', { class: 'pl-open pl-' + c.opening + (sel === it.id ? ' is-sel' : ''), 'data-id': it.id }, svg);
    var x = it.x, y = it.y, w = it.w, h = it.h, t = P.wall;
    if (c.opening === 'door') {
      var cx = x + w / 2, cy = y + w / 2, tf = 'rotate(' + (it.r || 0) + ' ' + fix(cx) + ' ' + fix(cy) + ')';
      if (it.m) tf += ' translate(' + fix(2 * cx) + ' 0) scale(-1 1)';
      g.setAttribute('transform', tf);
      el('rect', { x: x, y: y - t / 2 - 0.02, width: w, height: t + 0.04, class: 'pl-gap' }, g);
      el('line', { x1: x, y1: y, x2: x, y2: y + w, class: 'pl-grab' }, g);
      el('line', { x1: x, y1: y, x2: x, y2: y + w, class: 'pl-leaf' + (it.kind === 'mainDoor' ? ' pl-main' : '') }, g);
      el('path', { d: 'M ' + fix(x + w) + ' ' + fix(y) + ' A ' + fix(w) + ' ' + fix(w) + ' 0 0 1 ' + fix(x) + ' ' + fix(y + w), class: 'pl-swing' }, g);
    } else {
      var horiz = w >= h;
      el('rect', horiz ? { x: x, y: y - 0.02, width: w, height: h + 0.04, class: 'pl-gap' } : { x: x - 0.02, y: y, width: w + 0.04, height: h, class: 'pl-gap' }, g);
      el('rect', { x: x, y: y, width: w, height: h, class: c.opening === 'window' ? 'pl-win' : 'pl-hit' }, g);
      if (c.opening === 'window') {
        el('line', horiz ? { x1: x, y1: y + h / 2, x2: x + w, y2: y + h / 2 } : { x1: x + w / 2, y1: y, x2: x + w / 2, y2: y + h }, g).setAttribute('class', 'pl-glass');
      } else {
        var a = horiz
          ? [{ x1: x, y1: y + h * 0.3, x2: x + w * 0.55, y2: y + h * 0.3 }, { x1: x + w * 0.45, y1: y + h * 0.7, x2: x + w, y2: y + h * 0.7 }]
          : [{ x1: x + w * 0.3, y1: y, x2: x + w * 0.3, y2: y + h * 0.55 }, { x1: x + w * 0.7, y1: y + h * 0.45, x2: x + w * 0.7, y2: y + h }];
        a.forEach(function (l) { el('line', l, g).setAttribute('class', 'pl-panel'); });
      }
    }
    if (sel === it.id && c.opening !== 'door') el('rect', { x: it.x + it.w - 0.14, y: it.y + it.h - 0.14, width: 0.14, height: 0.14, class: 'pl-handle', 'data-handle': it.id }, g);
  }

  // Put a door or window onto the nearest room wall within reach, facing into that room.
  function snapOpening(it) {
    var c = P.catalog[it.kind];
    if (!c || !c.opening) return;
    var door = c.opening === 'door', len = door ? it.w : Math.max(it.w, it.h), t = P.wall;
    var cx = it.x + it.w / 2, cy = it.y + it.h / 2, best = null;
    plan.rooms.forEach(function (r) {
      [
        { o: 'h', at: r.y, a: r.x, b: r.x + r.w, rot: 0 },
        { o: 'h', at: r.y + r.h, a: r.x, b: r.x + r.w, rot: 180 },
        { o: 'v', at: r.x, a: r.y, b: r.y + r.h, rot: 270 },
        { o: 'v', at: r.x + r.w, a: r.y, b: r.y + r.h, rot: 90 },
      ].forEach(function (e) {
        if (e.b - e.a < len) return;
        var along = e.o === 'h' ? cx : cy, across = e.o === 'h' ? cy : cx;
        if (along < e.a - 0.3 || along > e.b + 0.3) return;
        // A door's square sits inside the room, so measure from where its centre would be.
        var target = door ? e.at + (e.rot === 0 || e.rot === 270 ? 1 : -1) * len / 2 : e.at;
        var d = Math.abs(across - target);
        if (d < (door ? 0.6 : 0.45) && (!best || d < best.d)) best = { e: e, d: d, along: along };
      });
    });
    if (!best) return;
    var e = best.e, start = fix(round(Math.min(Math.max(best.along - len / 2, e.a), e.b - len)));
    if (door) {
      it.r = e.rot;
      if (e.o === 'h') { it.x = start; it.y = fix(e.rot === 0 ? e.at : e.at - len); }
      else { it.y = start; it.x = fix(e.rot === 270 ? e.at : e.at - len); }
    } else if (e.o === 'h') { it.w = fix(len); it.h = t; it.x = start; it.y = fix(e.at - t / 2); }
    else { it.h = fix(len); it.w = t; it.y = start; it.x = fix(e.at - t / 2); }
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
    var op = !isRoom && P.catalog[o.kind].opening;
    if (op) {
      html += '<div class="field"><label for="pl-len">Width (m)</label><input id="pl-len" type="number" min="0.5" max="6" step="0.05" value="' + fix(op === 'door' ? o.w : Math.max(o.w, o.h)) + '"></div>';
      html += '<p class="pl-actions">' + (op === 'door' ? '<button type="button" class="btn btn-sm btn-outline" id="pl-swing">Swing other side</button> <button type="button" class="btn btn-sm btn-outline" id="pl-flip">Flip hinge</button> ' : '<button type="button" class="btn btn-sm btn-outline" id="pl-rot">Rotate</button> ')
        + '<button type="button" class="btn btn-sm btn-outline" id="pl-dup">Duplicate</button> <button type="button" class="btn btn-sm btn-outline pl-del" id="pl-del">Delete</button></p>'
        + '<p class="muted small">Drag it near a wall and it snaps into place, facing into the room.</p>';
      box.innerHTML = html;
      $('pl-len').addEventListener('input', function (e) {
        var v = Number(e.target.value); if (!(v >= 0.5 && v <= 6)) return;
        if (op === 'door') { o.w = o.h = fix(v); } else if (o.w >= o.h) { o.w = fix(v); } else { o.h = fix(v); }
        save(); redrawKeepPanel();
      });
      if (op === 'door') {
        // Swing into the room on the other side of the same wall: the door's square moves across the wall line.
        $('pl-swing').addEventListener('click', function () {
          var r = o.r || 0;
          if (r === 0) o.y = fix(o.y - o.w); else if (r === 180) o.y = fix(o.y + o.w);
          else if (r === 270) o.x = fix(o.x - o.w); else o.x = fix(o.x + o.w);
          o.r = (r + 180) % 360; save(); draw();
        });
        $('pl-flip').addEventListener('click', function () { o.m = o.m ? 0 : 1; save(); draw(); });
      } else {
        $('pl-rot').addEventListener('click', function () { var w = o.w; o.w = o.h; o.h = w; save(); draw(); });
      }
      $('pl-dup').addEventListener('click', function () { var c = clone(o); c.id = 'i' + nextId++; c.x = fix(c.x + 0.4); (plan.items).push(c); sel = c.id; snapOpening(c); save(); draw(); });
      $('pl-del').addEventListener('click', remove);
      return;
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
      + '<li><span>Doors and windows</span><span>' + q.doors + ' door' + (q.doors === 1 ? '' : 's') + ', ' + q.windows + ' window' + (q.windows === 1 ? '' : 's') + '</span></li>'
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
    if (bgMode === 'cal' && bg.url) {
      if (cal.length >= 2) cal = [];
      cal.push({ x: p.x, y: p.y });
      if (cal.length === 1) bgMsg('Now click the other end of that wall.');
      else { bgMsg('Type the real length of that wall in metres, then press Apply.'); $('pl-bgcalbox').hidden = false; $('pl-bgcallen').focus(); }
      draw(); e.preventDefault(); return;
    }
    if (bgMode === 'move' && bg.url) { drag = { mode: 'bgmove', sx: p.x, sy: p.y, x: bg.x, y: bg.y }; svg.setPointerCapture(e.pointerId); e.preventDefault(); return; }
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
    if (drag.mode === 'bgmove') { bg.x = fix(drag.x + dx); bg.y = fix(drag.y + dy); drag.moved = true; draw(); return; }
    if (drag.mode === 'move') { drag.o.x = fix(round(drag.x + dx)); drag.o.y = fix(round(drag.y + dy)); }
    else { drag.o.w = fix(Math.max(0.2, round(drag.w + dx))); drag.o.h = fix(Math.max(0.2, round(drag.h + dy))); }
    drag.moved = true;
    draw();
  });
  var end = function () {
    if (drag && drag.moved) { if (drag.o) snapOpening(drag.o); save(); draw(); }
    drag = null;
  };
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
      if (c.opening === 'door') { it.r = 0; it.m = 0; }
      plan.items.push(it); sel = it.id; snapOpening(it); save(); draw();
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
  function bgMsg(t) { $('pl-bgmsg').textContent = t; }
  function setMode(m) {
    bgMode = bgMode === m ? '' : m;
    if (bgMode !== 'cal') { cal = []; $('pl-bgcalbox').hidden = true; }
    $('pl-bgcal').setAttribute('aria-pressed', String(bgMode === 'cal'));
    $('pl-bgmove').setAttribute('aria-pressed', String(bgMode === 'move'));
    svg.style.cursor = bgMode ? 'crosshair' : '';
    bgMsg(bgMode === 'cal' ? 'Click one end of a wall whose real length you know.' : bgMode === 'move' ? 'Drag to slide the picture. Press the button again to go back to editing rooms.' : '');
    draw();
  }
  $('pl-bgcal').addEventListener('click', function () { setMode('cal'); });
  $('pl-bgmove').addEventListener('click', function () { setMode('move'); });
  $('pl-bgrot').addEventListener('input', function (e) { bg.rot = Number(e.target.value) || 0; draw(); });
  $('pl-bgcalok').addEventListener('click', function () {
    var len = Number($('pl-bgcallen').value);
    if (cal.length !== 2 || !(len > 0.2 && len < 100)) { bgMsg('Click two points, then type a length between 0.2 and 100 metres.'); return; }
    var d = Math.sqrt(Math.pow(cal[1].x - cal[0].x, 2) + Math.pow(cal[1].y - cal[0].y, 2));
    if (d < 0.05) { bgMsg('Those points are too close together. Click two points further apart.'); return; }
    var k = len / d, p0 = cal[0];
    // Scale the picture about the first point so that point stays put.
    bg.x = fix(p0.x + k * (bg.x - p0.x)); bg.y = fix(p0.y + k * (bg.y - p0.y)); bg.width = fix(bg.width * k);
    $('pl-bgw').value = Math.min(60, Math.max(2, bg.width));
    cal = []; $('pl-bgcalbox').hidden = true; $('pl-bgcallen').value = '';
    bgMode = ''; $('pl-bgcal').setAttribute('aria-pressed', 'false'); svg.style.cursor = '';
    bgMsg('Scale set. Rooms you draw now match the real size. Use "Move picture" to line it up, then trace over it.');
    draw(); fit();
  });
  $('pl-bgclear').addEventListener('click', function () {
    if (bg.url) URL.revokeObjectURL(bg.url);
    bg.url = ''; bg.x = 0; bg.y = 0; bg.rot = 0; $('pl-bgrot').value = 0; cal = []; bgMode = ''; svg.style.cursor = '';
    $('pl-bg').value = ''; $('pl-bgopts').hidden = true; bgMsg(''); draw();
  });

  if (!restore()) load('hdb4');
  else { $('pl-home').value = P.layouts[plan.home] ? plan.home : 'hdb4'; draw(); fit(); }
})();
