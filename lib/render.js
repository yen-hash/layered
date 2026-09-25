// lib/render.js — tiny HTML templating helpers (no template engine dependency).

export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function layout({ title = 'Layered', body = '', business = null, flash = null }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Layered</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="/"><img src="/logo-mark.svg" alt="" class="logo-mark">Layered</a>
    <nav class="main-nav">
      <a href="/designers">Find Designers</a>
      <a href="/#get-recommendations">Get Recommendations</a>
      ${business
        ? `<a href="/dashboard">Dashboard</a><a href="/logout">Log out</a>`
        : `<a href="/login">Business Login</a><a class="btn btn-sm" href="/signup">List Your Business</a>`
      }
    </nav>
  </div>
</header>
${flash ? `<div class="flash flash-${esc(flash.type)}"><div class="wrap">${esc(flash.message)}</div></div>` : ''}
<main>${body}</main>
<footer class="site-footer">
  <div class="wrap">
    <p><strong>Layered</strong> — connecting homeowners with trusted interior designers.</p>
    <p class="muted">Demo build. Business directory, dashboard and lead routing are fully functional; payments and identity verification are not implemented.</p>
  </div>
</footer>
</body>
</html>`;
}

export function flashFromQuery(query) {
  if (query.get('ok')) return { type: 'ok', message: query.get('ok') };
  if (query.get('err')) return { type: 'err', message: query.get('err') };
  return null;
}

const ROOM_ILLUSTRATIONS = [
  '/illustrations/room-living.svg',
  '/illustrations/room-kitchen.svg',
  '/illustrations/room-bedroom.svg',
  '/illustrations/room-generic.svg',
];

// Deterministically picks a placeholder room illustration for a given seed
// (e.g. a project or business id) so the same item always gets the same
// picture instead of a random one on every render.
export function placeholderIllustration(seed) {
  const n = typeof seed === 'number' ? seed : String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROOM_ILLUSTRATIONS[n % ROOM_ILLUSTRATIONS.length];
}
