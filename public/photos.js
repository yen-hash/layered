// Shrinks big photos in the browser before upload (phone photos are often 4-10MB), so a whole portfolio fits in one
// submission. Only runs where the browser can decode and re-encode images; otherwise the originals are sent unchanged
// and the server applies its own limits.
(function () {
  var MAX_SIDE = 2400, QUALITY = 0.86, SHRINK_OVER = 1.2 * 1024 * 1024;
  function status(input) {
    var el = input.parentNode.querySelector('.photo-status');
    if (!el) { el = document.createElement('p'); el.className = 'hint photo-status'; el.setAttribute('role', 'status'); input.parentNode.appendChild(el); }
    return el;
  }
  function mb(n) { return (n / 1048576).toFixed(1) + 'MB'; }
  function shrink(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= SHRINK_OVER || !window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bmp) {
      var scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      return new Promise(function (resolve) {
        c.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', QUALITY);
      });
    }).catch(function () { return file; });
  }
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('input[type=file][data-resize]') || !window.DataTransfer) return;
    var files = Array.prototype.slice.call(input.files || []);
    if (!files.length) return;
    var msg = status(input), before = files.reduce(function (a, f) { return a + f.size; }, 0);
    msg.textContent = 'Preparing ' + files.length + ' photo' + (files.length === 1 ? '' : 's') + '…';
    var form = input.form, submit = form && form.querySelector('[type=submit]');
    if (submit) submit.disabled = true;
    Promise.all(files.map(shrink)).then(function (out) {
      var dt = new DataTransfer();
      out.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
      var after = out.reduce(function (a, f) { return a + f.size; }, 0);
      msg.textContent = out.length + ' photo' + (out.length === 1 ? '' : 's') + ', ' + mb(after) + (after < before ? ' (was ' + mb(before) + ')' : '');
    }).catch(function () { msg.textContent = ''; }).then(function () { if (submit) submit.disabled = false; });
  });
})();
