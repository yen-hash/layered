// Shortlist: slugs kept in this browser's localStorage only (nothing is sent to the server until /compare is opened).
(function () {
  var KEY = 'layered.shortlist', MAX = 4;
  function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }).slice(0, MAX) : []; } catch (e) { return []; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function paint() {
    var list = read();
    document.querySelectorAll('[data-save]').forEach(function (b) {
      var on = list.indexOf(b.getAttribute('data-save')) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('saved', on);
      b.title = on ? 'Remove from shortlist' : 'Save to shortlist';
    });
    var bar = document.getElementById('shortlist-bar');
    if (!bar && list.length) {
      bar = document.createElement('div'); bar.id = 'shortlist-bar'; bar.className = 'shortlist-bar';
      bar.setAttribute('role', 'status'); document.body.appendChild(bar);
    }
    if (bar) {
      if (!list.length) { bar.remove(); return; }
      bar.innerHTML = '<span></span><a class="btn" href="/compare?d=' + encodeURIComponent(list.join(',')) + '">Compare</a>';
      bar.firstChild.textContent = list.length + ' saved' + (list.length >= MAX ? ' (max ' + MAX + ')' : '');
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-save]');
    if (!b) return;
    e.preventDefault();
    var slug = b.getAttribute('data-save'), list = read(), i = list.indexOf(slug);
    if (i > -1) list.splice(i, 1); else if (list.length < MAX) list.push(slug); else { alert('You can compare up to ' + MAX + ' designers. Remove one first.'); return; }
    write(list); paint();
  });
  window.layeredShortlist = { read: read, write: write, paint: paint };
  paint();
})();
