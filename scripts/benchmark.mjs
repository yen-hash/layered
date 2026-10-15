// scripts/benchmark.mjs — daily public-signal benchmark of Layered against HomeTrust and Qanvast.
// Measures only what is visible to any visitor or crawler (sitemaps, on-page SEO tags, structured data, page weight,
// response time). It does NOT measure traffic, rankings or backlinks: those need a paid SEO tool.
// Polite by design: identifies itself, honours robots.txt Disallow, 1 request per second, small page sample.
// Usage: node scripts/benchmark.mjs [--out docs/benchmark]
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';

const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/benchmark';
const UA = 'Mozilla/5.0 (compatible; LayeredBenchmark/1.0; +https://layeredsg.com)';
const SAMPLE = 14;
const SITES = [
  { key: 'layered', name: 'Layered', origin: 'https://layeredsg.com' },
  { key: 'hometrust', name: 'HomeTrust', origin: 'https://www.hometrust.sg' },
  { key: 'qanvast', name: 'Qanvast', origin: 'https://qanvast.com' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400000;

async function get(url, { timeout = 25000, text = true } = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xml,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
    const body = text ? await res.text() : '';
    return { ok: res.ok, status: res.status, ms: Math.round(performance.now() - t0), bytes: Buffer.byteLength(body), body, url: res.url };
  } catch (e) { return { ok: false, status: 0, ms: Math.round(performance.now() - t0), bytes: 0, body: '', error: String(e.message || e) }; }
}

function disallowed(robots, pathname) {
  let applies = false; const rules = [];
  for (const raw of robots.split('\n')) {
    const line = raw.replace(/#.*/, '').trim(); const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') applies = v === '*';
    else if (applies && k === 'disallow' && v) rules.push(v);
  }
  return rules.some((r) => pathname.startsWith(r.replace(/\*.*$/, '')));
}

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({ loc: m[1].replace(/&amp;/g, '&'), lastmod: m[2] || '' }));

async function collectSitemap(origin, robots) {
  const start = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const queue = start.length ? start : [`${origin}/sitemap.xml`];
  const seen = new Set(), urls = [], files = [];
  while (queue.length && seen.size < 12) {
    const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
    await sleep(1000);
    const r = await get(u, { timeout: 40000 }); if (!r.ok) continue;
    const entries = locs(r.body);
    if (/<sitemapindex/i.test(r.body)) {
      // Skip pure image/photo sitemaps: they inflate counts without being pages.
      entries.filter((e) => !/photo|image|video/i.test(e.loc)).forEach((e) => queue.push(e.loc));
      files.push({ file: u, children: entries.length });
    } else { files.push({ file: u, urls: entries.length }); urls.push(...entries); }
  }
  return { urls, files };
}

function analyse(html) {
  const g = (re) => { const m = html.match(re); return m ? m[1] : ''; };
  const title = g(/<title[^>]*>([^<]*)/i).trim();
  const desc = g(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || g(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const types = new Set([...html.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)].map((m) => m[1]));
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    titleLen: title.length, descLen: desc.length, h1: (html.match(/<h1[\s>]/gi) || []).length,
    canonical: /<link[^>]+rel=["']canonical["']/i.test(html), og: /property=["']og:image["']/i.test(html),
    viewport: /name=["']viewport["']/i.test(html), noindex: /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html),
    imgs: imgs.length, imgsAlt: imgs.filter((i) => /\salt=["'][^"']+["']/i.test(i)).length,
    schema: [...types], words: text ? text.split(' ').length : 0,
  };
}

const pass = (a) => a.titleLen >= 30 && a.titleLen <= 65 && a.descLen >= 100 && a.descLen <= 170 && a.h1 === 1 && a.canonical && a.og;

async function measureSite(site, base, { timed }) {
  const out = { name: site.name, origin: site.origin, measuredFrom: timed ? 'live' : 'local build' };
  const rob = await get(`${base}/robots.txt`);
  out.robots = rob.ok;
  const robots = rob.ok ? rob.body : '';
  const home = await get(`${base}/`);
  out.home = { status: home.status, ms: home.ms, htmlBytes: home.bytes, ...(home.ok ? analyse(home.body) : {}) };
  const sm = await collectSitemap(base, robots);
  const now = Date.now();
  const dated = sm.urls.filter((u) => u.lastmod && !Number.isNaN(Date.parse(u.lastmod)));
  out.sitemap = {
    urls: sm.urls.length, files: sm.files.length,
    withLastmod: dated.length,
    updated30d: dated.filter((u) => now - Date.parse(u.lastmod) < 30 * DAY).length,
    updated7d: dated.filter((u) => now - Date.parse(u.lastmod) < 7 * DAY).length,
    updated90d: dated.filter((u) => now - Date.parse(u.lastmod) < 90 * DAY).length,
  };
  // Even-spaced sample so the same kinds of pages are measured every day.
  const pool = sm.urls.map((u) => u.loc).filter((u) => !disallowed(robots, new URL(u, base).pathname)).sort();
  const picks = pool.length <= SAMPLE ? pool : Array.from({ length: SAMPLE }, (_, i) => pool[Math.floor((i * pool.length) / SAMPLE)]);
  const rows = [];
  for (const u of picks) {
    await sleep(1000);
    const r = await get(u.startsWith('http') ? u.replace(site.origin, base) : `${base}${u}`);
    if (r.ok) rows.push({ url: u, ms: r.ms, bytes: r.bytes, ...analyse(r.body) });
  }
  const n = rows.length || 1, avg = (f) => Math.round(rows.reduce((s, r) => s + f(r), 0) / n);
  out.sample = {
    pages: rows.length,
    passRate: Math.round((100 * rows.filter(pass).length) / n),
    avgWords: avg((r) => r.words), avgBytes: avg((r) => r.bytes), avgMs: avg((r) => r.ms),
    altCoverage: Math.round((100 * rows.reduce((s, r) => s + r.imgsAlt, 0)) / Math.max(1, rows.reduce((s, r) => s + r.imgs, 0))),
    schemaTypes: [...new Set(rows.flatMap((r) => r.schema).concat(out.home.schema || []))].sort(),
    noindexPages: rows.filter((r) => r.noindex).length,
    issues: rows.filter((r) => !pass(r)).slice(0, 5).map((r) => ({ url: r.url, title: r.titleLen, desc: r.descLen, h1: r.h1, canonical: r.canonical, og: r.og })),
  };
  return out;
}

// Local build of Layered: what production would serve, with every queued article that is due published.
async function withLocalLayered(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'layered-bench-'));
  const env = { ...process.env, DB_PATH: path.join(tmp, 'app.db'), UPLOAD_DIR: path.join(tmp, 'up'), PORT: '3981', SITE_URL: 'https://layeredsg.com', NODE_ENV: 'production', SESSION_SECRET: 'bench', SEED_DEMO: '0' };
  spawnSync(process.execPath, ['scripts/seed.js'], { env }); spawnSync(process.execPath, ['scripts/seed-blog.js'], { env });
  spawnSync(process.execPath, ['-e', "import('./lib/schedule.js').then(m=>m.publishDue())"], { env });
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:3981/')).ok) break; } catch { /* starting */ } await sleep(200); }
  try { return await fn('http://127.0.0.1:3981'); } finally { srv.kill(); }
}

const clamp = (v) => Math.max(0, Math.min(100, v));
function score(results) {
  const maxUrls = Math.max(...results.map((r) => r.sitemap.urls), 1);
  return results.map((r) => {
    const s = {};
    s.scale = Math.round(clamp((100 * Math.log10(r.sitemap.urls + 1)) / Math.log10(maxUrls + 1)));
    s.freshness = r.sitemap.withLastmod ? Math.round((100 * r.sitemap.updated90d) / r.sitemap.withLastmod) : null;
    s.onpage = r.sample.passRate;
    s.structured = Math.round(clamp((r.sample.schemaTypes.length / 8) * 100));
    s.speed = r.measuredFrom === 'live' ? Math.round(clamp(100 - (r.sample.avgMs - 400) / 15 - Math.max(0, r.sample.avgBytes - 400000) / 20000)) : null;
    const vals = Object.values(s).filter((v) => v !== null);
    return { name: r.name, ...s, overall: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) };
  });
}

async function main() {
  const day = new Date().toISOString().slice(0, 10);
  const results = [];
  // Layered: live if reachable, else the local build.
  const probe = await get('https://layeredsg.com/', { timeout: 12000 });
  if (probe.ok) results.push(await measureSite(SITES[0], SITES[0].origin, { timed: true }));
  else results.push(await withLocalLayered((base) => measureSite(SITES[0], base, { timed: false })));
  for (const s of SITES.slice(1)) results.push(await measureSite(s, s.origin, { timed: true }));
  const scores = score(results);

  fs.mkdirSync(OUT, { recursive: true });
  const histFile = path.join(OUT, 'history.csv');
  const head = 'date,site,overall,scale,freshness,onpage,structured,speed,sitemap_urls,updated_30d,updated_7d,pass_rate,avg_words,avg_ms\n';
  if (!fs.existsSync(histFile)) fs.writeFileSync(histFile, head);
  const lines = results.map((r, i) => [day, r.name, scores[i].overall, scores[i].scale, scores[i].freshness ?? '', scores[i].onpage, scores[i].structured, scores[i].speed ?? '', r.sitemap.urls, r.sitemap.updated30d, r.sitemap.updated7d, r.sample.passRate, r.sample.avgWords, r.sample.avgMs].join(','));
  const kept = fs.readFileSync(histFile, 'utf8').split('\n').filter((l) => l && !l.startsWith(`${day},`));
  fs.writeFileSync(histFile, kept.join('\n') + '\n' + lines.join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, `${day}.json`), JSON.stringify({ day, results, scores }, null, 2));

  const f = (v) => (v === null || v === undefined ? 'n/a' : v);
  const md = [
    `# Competitor benchmark, ${day}`,
    '',
    'Public signals only (sitemaps, page tags, structured data, page weight, response time). Not measured: traffic, rankings, backlinks, domain authority. Scores are indicative, 0 to 100.',
    results[0].measuredFrom === 'local build' ? '\nLayered was measured from its local build (layeredsg.com was not reachable from the benchmark machine), so Layered has no speed score.' : '',
    '',
    '| Dimension | ' + results.map((r) => r.name).join(' | ') + ' |',
    '|---|' + results.map(() => '---|').join(''),
    ...['overall', 'scale', 'freshness', 'onpage', 'structured', 'speed'].map((k) => `| ${k === 'onpage' ? 'on-page hygiene' : k === 'structured' ? 'structured data' : k} | ${scores.map((s) => f(s[k])).join(' | ')} |`),
    `| indexable URLs in sitemap | ${results.map((r) => r.sitemap.urls).join(' | ')} |`,
    `| URLs updated in last 7 / 30 days | ${results.map((r) => `${r.sitemap.updated7d} / ${r.sitemap.updated30d}`).join(' | ')} |`,
    `| sampled pages passing the on-page checks | ${results.map((r) => `${r.sample.passRate}% of ${r.sample.pages}`).join(' | ')} |`,
    `| average words per sampled page | ${results.map((r) => r.sample.avgWords).join(' | ')} |`,
    `| home page HTML size (KB) | ${results.map((r) => Math.round(r.home.htmlBytes / 1024)).join(' | ')} |`,
    `| average response time (ms) | ${results.map((r) => (r.measuredFrom === 'live' ? r.sample.avgMs : 'n/a')).join(' | ')} |`,
    `| image alt-text coverage | ${results.map((r) => r.sample.altCoverage + '%').join(' | ')} |`,
    `| structured data types seen | ${results.map((r) => r.sample.schemaTypes.slice(0, 6).join(', ') || 'none').join(' | ')} |`,
    '',
    '## Where Layered trails',
    ...(() => {
      const L = scores[0], others = scores.slice(1), out = [];
      for (const k of ['scale', 'freshness', 'onpage', 'structured', 'speed']) {
        const best = others.reduce((a, b) => ((b[k] ?? -1) > (a[k] ?? -1) ? b : a));
        if (L[k] !== null && best[k] !== null && best[k] > L[k]) out.push(`- ${k}: Layered ${L[k]} vs ${best.name} ${best[k]}`);
      }
      return out.length ? out : ['- Nothing measured: Layered is level or ahead on every measured dimension.'];
    })(),
    '',
    '## Layered page issues in the sample',
    ...(results[0].sample.issues.length ? results[0].sample.issues.map((i) => `- ${i.url}: title ${i.title}, description ${i.desc}, H1 ${i.h1}, canonical ${i.canonical}, og:image ${i.og}`) : ['- None.']),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'latest.md'), md);
  console.log(md);
}
main().catch((e) => { console.error(e); process.exit(1); });
