import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { db } from './db.js';
import { parseCookies, verifySessionToken } from './lib/auth.js';
import { parseForm } from './lib/body.js';
import { flashFromQuery, layout } from './lib/render.js';
import { siteUrl } from './lib/seo.js';

import { uploadFileFor } from './lib/paths.js';
import { check as rateCheck, clientIp } from './lib/ratelimit.js';
import { compareRoute } from './routes/compare.js';
import { articlesList, articleEditor, articleSave, articleDelete, articleReview } from './routes/articles.js';
import { reviewInvite, reviewFormPage, reviewSubmit, reviewsAdmin, reviewModerate } from './routes/reviews.js';
import { homeRoute, directoryRoute, designerProfileRoute, submitLeadRoute } from './routes/public.js';
import { robotsRoute, sitemapRoute } from './routes/seo.js';
import { blogIndexRoute, blogCategoryRoute, blogPostRoute, rssRoute } from './routes/blog.js';
import { blogAdminList, blogAdminEditor, blogAdminSave, blogAdminDelete } from './routes/blogAdmin.js';
import { isAdmin } from './lib/admin.js';
import { calculatorRoute, estimatorRoute, plannerRoute } from './routes/tools.js';
import { verificationList, verificationAction } from './routes/verification.js';
import { infoPageRoute } from './routes/pages.js';
import { startPublisher } from './lib/schedule.js';
import { servicesIndexRoute, tradeRoute, landedRoute } from './routes/services.js';
import { propertyLandingRoute, styleLandingRoute, guidesIndexRoute, guideRoute, checklistRoute } from './routes/content.js';
import { signupPage, signupSubmit, loginPage, loginSubmit, logoutRoute, forgotPage, forgotSubmit, resetPage, resetSubmit } from './routes/auth.js';
import {
  dashboardHome, profilePage, profileSubmit,
  projectsPage, projectCreate, projectDelete, projectEditPage, projectUpdate,
  leadsPage, leadDetailPage, leadStatusUpdate,
} from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const COMPRESSIBLE = new Set(['.css', '.js', '.svg']);
const gzipCache = new Map(); // etag -> gzipped buffer

function serveStatic(req, res, url) {
  const pathname = decodeURIComponent(url.pathname);
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.statusCode = 403; res.end('Forbidden'); return true; }
  // Uploads live in UPLOAD_DIR (a persistent disk in production); fall back to files bundled in the repo.
  const stored = uploadFileFor(pathname);
  if (stored && fs.existsSync(stored)) filePath = stored;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath);
  const st = fs.statSync(filePath);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', st.mtime.toUTCString());
  // CSS keeps a stable URL, so revalidate it hourly; images change rarely.
  res.setHeader('Cache-Control', ext === '.css' ? 'public, max-age=3600' : 'public, max-age=604800');
  if (req.headers['if-none-match'] === etag) { res.statusCode = 304; res.end(); return true; }
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    let buf = gzipCache.get(etag);
    if (!buf) { buf = zlib.gzipSync(fs.readFileSync(filePath)); gzipCache.set(etag, buf); }
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
    return true;
  }
  fs.createReadStream(filePath).pipe(res);
  return true;
}

// gzip dynamic HTML/XML responses (handlers just call res.end(string)).
function enableCompression(req, res) {
  if (res.isHead) return;
  if (!/\bgzip\b/.test(req.headers['accept-encoding'] || '')) return;
  const end = res.end.bind(res);
  res.end = (chunk, ...rest) => {
    const type = String(res.getHeader('Content-Type') || '');
    if (typeof chunk === 'string' && chunk.length > 1024 && !res.headersSent && !res.getHeader('Content-Encoding') && /html|xml|text\/plain/.test(type)) {
      const buf = zlib.gzipSync(chunk);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Length', buf.length);
      return end(buf);
    }
    return end(chunk, ...rest);
  };
}

const PRIVATE_PREFIXES = ['/dashboard', '/login', '/logout', '/leads', '/review', '/forgot', '/reset'];

function getSessionBusiness(req) {
  const cookies = parseCookies(req);
  const businessId = verifySessionToken(cookies.session);
  if (!businessId) return null;
  return db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId) || null;
}

function requireAuthOrRedirect(res, ctx) {
  if (!ctx.business) {
    res.writeHead(302, { Location: '/login?err=' + encodeURIComponent('Please log in to continue.') });
    res.end();
    return false;
  }
  return true;
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Crawlers and CDNs probe with HEAD: answer exactly like GET, minus the body.
  if (req.method === 'HEAD') {
    req.method = 'GET';
    res.write = () => true;
    const finish = res.end.bind(res);
    res.end = () => finish();
    res.isHead = true;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // One URL per page: /designers/ -> /designers (permanent), so crawlers don't see duplicates.
  if ((req.method === 'GET') && url.pathname.length > 1 && url.pathname.endsWith('/')) {
    res.writeHead(301, { Location: url.pathname.replace(/\/+$/, '') + url.search });
    res.end();
    return;
  }

  if (req.method === 'GET' && (
    url.pathname === '/style.css' ||
    url.pathname === '/shortlist.js' ||
    url.pathname === '/photos.js' ||
    url.pathname === '/planner.js' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/logo-mark.svg' ||
    url.pathname === '/og-default.jpg' ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/illustrations/') ||
    url.pathname.startsWith('/images/')
  )) {
    if (serveStatic(req, res, url)) return;
  }

  // HTML is served by handlers calling res.end(string); make sure it is labelled and compressed.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  enableCompression(req, res);
  if (PRIVATE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'private, no-store');
  }

  const business = getSessionBusiness(req);
  const ctx = { business, flash: flashFromQuery(url.searchParams), site: siteUrl(req), isAdmin: isAdmin(business) };

  try {
    // ----- Abuse protection on public POST endpoints -----
    const limited = rateCheck(req.method, url.pathname, clientIp(req));
    if (limited) {
      res.statusCode = 429;
      res.setHeader('Retry-After', String(limited.retryAfter));
      res.setHeader('Cache-Control', 'no-store');
      res.end(layout({ title: 'Too many attempts', noindex: true, site: ctx.site, body: `<div class="wrap" style="padding:60px 0;"><h1>Too many attempts</h1><p class="muted">Please wait about ${Math.ceil(limited.retryAfter / 60)} minute(s) and try again.</p><p><a href="/">Back home</a></p></div>`, business: ctx.business }));
      return;
    }

    // ----- SEO files -----
    if (req.method === 'GET' && url.pathname === '/robots.txt') return robotsRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/sitemap.xml') return sitemapRoute(req, res, ctx);

    // ----- Public -----
    if (req.method === 'GET' && url.pathname === '/') return await homeRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/designers') return await directoryRoute(req, res, ctx, url);
    if (req.method === 'GET' && url.pathname.startsWith('/designers/')) {
      const slug = url.pathname.split('/')[2];
      return await designerProfileRoute(req, res, ctx, slug);
    }
    if (req.method === 'GET' && url.pathname === '/compare') return await compareRoute(req, res, ctx, url);
    if (req.method === 'GET' && url.pathname === '/tools/renovation-cost-calculator') return await calculatorRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/tools/renovation-cost-estimator') return await estimatorRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/tools/room-planner') return await plannerRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/blog') return await blogIndexRoute(req, res, ctx, url);
    if (req.method === 'GET' && url.pathname === '/blog/rss.xml') return await rssRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname.startsWith('/blog/category/')) return await blogCategoryRoute(req, res, ctx, url, url.pathname.split('/')[3]);
    if (req.method === 'GET' && url.pathname.startsWith('/blog/')) return await blogPostRoute(req, res, ctx, url.pathname.split('/')[2]);
    if (req.method === 'GET' && ['/about', '/privacy', '/terms'].includes(url.pathname)) return infoPageRoute(req, res, ctx, url.pathname.slice(1));
    if (req.method === 'GET' && url.pathname === '/services') return await servicesIndexRoute(req, res, ctx);
    if (req.method === 'GET' && /^\/services\/[a-z-]+$/.test(url.pathname)) return await tradeRoute(req, res, ctx, url.pathname.split('/')[2]);
    if (req.method === 'GET' && url.pathname === '/landed') return await landedRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/guides') return await guidesIndexRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/guides/renovation-checklist-singapore') return await checklistRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname.startsWith('/guides/')) return await guideRoute(req, res, ctx, url.pathname.split('/')[2]);
    if (req.method === 'GET' && url.pathname.startsWith('/interior-designers/style/')) return await styleLandingRoute(req, res, ctx, url.pathname.split('/')[3]);
    if (req.method === 'GET' && url.pathname.startsWith('/interior-designers/')) return await propertyLandingRoute(req, res, ctx, url.pathname.split('/')[2]);
    if (req.method === 'GET' && url.pathname === '/interior-designers') {
      res.writeHead(301, { Location: '/designers' });
      res.end();
      return;
    }
    const reviewTok = url.pathname.match(/^\/review\/([0-9a-f]+)$/);
    if (req.method === 'GET' && reviewTok) return await reviewFormPage(req, res, ctx, reviewTok[1]);
    if (req.method === 'POST' && reviewTok) {
      const { fields } = await parseForm(req);
      return await reviewSubmit(req, res, ctx, reviewTok[1], fields);
    }
    if (req.method === 'POST' && url.pathname === '/leads') {
      const { fields } = await parseForm(req);
      return await submitLeadRoute(req, res, ctx, fields);
    }

    // ----- Auth -----
    if (req.method === 'GET' && url.pathname === '/signup') return await signupPage(req, res, ctx);
    if (req.method === 'POST' && url.pathname === '/signup') {
      const { fields } = await parseForm(req);
      return await signupSubmit(req, res, fields);
    }
    if (req.method === 'GET' && url.pathname === '/forgot') return await forgotPage(req, res, ctx);
    if (req.method === 'POST' && url.pathname === '/forgot') {
      const { fields } = await parseForm(req);
      return await forgotSubmit(req, res, ctx, fields);
    }
    const resetTok = url.pathname.match(/^\/reset\/([0-9a-f]+)$/);
    if (req.method === 'GET' && resetTok) return await resetPage(req, res, ctx, resetTok[1]);
    if (req.method === 'POST' && resetTok) {
      const { fields } = await parseForm(req);
      return await resetSubmit(req, res, ctx, resetTok[1], fields);
    }
    if (req.method === 'GET' && url.pathname === '/login') return await loginPage(req, res, ctx);
    if (req.method === 'POST' && url.pathname === '/login') {
      const { fields } = await parseForm(req);
      return await loginSubmit(req, res, fields);
    }
    if (url.pathname === '/logout') return await logoutRoute(req, res);

    // ----- Dashboard (auth required) -----
    if (url.pathname.startsWith('/dashboard')) {
      if (!requireAuthOrRedirect(res, ctx)) return;

      if (req.method === 'GET' && url.pathname === '/dashboard') return await dashboardHome(req, res, ctx);
      if (req.method === 'GET' && url.pathname === '/dashboard/profile') return await profilePage(req, res, ctx);
      if (req.method === 'POST' && url.pathname === '/dashboard/profile') {
        const { fields, files } = await parseForm(req, { allowFiles: true });
        return await profileSubmit(req, res, ctx, fields, files);
      }
      if (req.method === 'GET' && url.pathname === '/dashboard/projects') return await projectsPage(req, res, ctx);
      if (req.method === 'POST' && url.pathname === '/dashboard/projects') {
        const { fields, files, rejected } = await parseForm(req, { allowFiles: true });
        return await projectCreate(req, res, ctx, fields, files, rejected);
      }
      // ----- Firm-written articles -----
      if (req.method === 'GET' && url.pathname === '/dashboard/articles') return await articlesList(req, res, ctx);
      if (req.method === 'GET' && url.pathname === '/dashboard/articles/new') return await articleEditor(req, res, ctx, 0);
      const artEdit = url.pathname.match(/^\/dashboard\/articles\/(\d+)\/edit$/);
      if (req.method === 'GET' && artEdit) return await articleEditor(req, res, ctx, Number(artEdit[1]));
      if (req.method === 'POST' && url.pathname === '/dashboard/articles/save') {
        const { fields } = await parseForm(req);
        return await articleSave(req, res, ctx, fields);
      }
      const artDel = url.pathname.match(/^\/dashboard\/articles\/(\d+)\/delete$/);
      if (req.method === 'POST' && artDel) return await articleDelete(req, res, ctx, Number(artDel[1]));
      const artRev = url.pathname.match(/^\/dashboard\/articles\/(\d+)\/(approve|return)$/);
      if (req.method === 'POST' && artRev) {
        const { fields } = await parseForm(req);
        return await articleReview(req, res, ctx, Number(artRev[1]), artRev[2], fields);
      }

      // ----- Reviews -----
      const invMatch = url.pathname.match(/^\/dashboard\/leads\/(\d+)\/review-invite$/);
      if (req.method === 'POST' && invMatch) return await reviewInvite(req, res, ctx, Number(invMatch[1]));
      if (req.method === 'GET' && url.pathname === '/dashboard/reviews') return await reviewsAdmin(req, res, ctx);
      const modMatch = url.pathname.match(/^\/dashboard\/reviews\/(\d+)\/(publish|reject)$/);
      if (req.method === 'POST' && modMatch) return await reviewModerate(req, res, ctx, Number(modMatch[1]), modMatch[2]);

      // ----- Credential verification (admin) -----
      if (req.method === 'GET' && url.pathname === '/dashboard/verification') return await verificationList(req, res, ctx);
      const verMatch = url.pathname.match(/^\/dashboard\/verification\/(\d+)\/(hdb|casetrust)\/(verify|clear)$/);
      if (req.method === 'POST' && verMatch) return await verificationAction(req, res, ctx, Number(verMatch[1]), verMatch[2], verMatch[3]);

      // ----- Blog admin -----
      if (req.method === 'GET' && url.pathname === '/dashboard/blog') return await blogAdminList(req, res, ctx);
      if (req.method === 'GET' && url.pathname === '/dashboard/blog/new') return await blogAdminEditor(req, res, ctx, 0);
      const editMatch = url.pathname.match(/^\/dashboard\/blog\/(\d+)\/edit$/);
      if (req.method === 'GET' && editMatch) return await blogAdminEditor(req, res, ctx, Number(editMatch[1]));
      if (req.method === 'POST' && url.pathname === '/dashboard/blog/save') {
        const { fields } = await parseForm(req);
        return await blogAdminSave(req, res, ctx, fields);
      }
      const postDel = url.pathname.match(/^\/dashboard\/blog\/(\d+)\/delete$/);
      if (req.method === 'POST' && postDel) return await blogAdminDelete(req, res, ctx, Number(postDel[1]));

      const projEdit = url.pathname.match(/^\/dashboard\/projects\/(\d+)\/edit$/);
      if (req.method === 'GET' && projEdit) return await projectEditPage(req, res, ctx, Number(projEdit[1]));
      const projUpd = url.pathname.match(/^\/dashboard\/projects\/(\d+)$/);
      if (req.method === 'POST' && projUpd) {
        const { fields, files, rejected } = await parseForm(req, { allowFiles: true });
        return await projectUpdate(req, res, ctx, Number(projUpd[1]), fields, files, rejected);
      }

      const delMatch = url.pathname.match(/^\/dashboard\/projects\/(\d+)\/delete$/);
      if (req.method === 'POST' && delMatch) return await projectDelete(req, res, ctx, delMatch[1]);

      if (req.method === 'GET' && url.pathname === '/dashboard/leads') return await leadsPage(req, res, ctx);
      const leadMatch = url.pathname.match(/^\/dashboard\/leads\/(\d+)$/);
      if (req.method === 'GET' && leadMatch) return await leadDetailPage(req, res, ctx, leadMatch[1]);
      const statusMatch = url.pathname.match(/^\/dashboard\/leads\/(\d+)\/status$/);
      if (req.method === 'POST' && statusMatch) {
        const { fields } = await parseForm(req);
        return await leadStatusUpdate(req, res, ctx, statusMatch[1], fields);
      }
    }

    // ----- 404 -----
    res.statusCode = 404;
    res.end(layout({ title: 'Page not found', noindex: true, site: ctx.site, body: '<div class="wrap" style="padding:60px 0;"><h1>404 — Page not found</h1><p><a href="/">Back home</a> · <a href="/designers">Find a designer</a> · <a href="/guides">Renovation guides</a></p></div>', business: ctx.business }));
  } catch (err) {
    if (err && err.code === 'TOO_LARGE') {
      res.statusCode = 413;
      res.end(layout({ title: 'Upload too large', noindex: true, body: `<div class="wrap" style="padding:60px 0;"><h1>That upload is too large</h1><p class="muted">One submission can carry about 48MB. Add fewer photos at a time, or let your browser shrink them (photos over 1.2MB are resized automatically when JavaScript is on).</p><p><a class="btn" href="/dashboard/projects">Back to projects</a></p></div>`, business: ctx.business }));
      return;
    }
    console.error(err);
    res.statusCode = 500;
    res.end(layout({ title: 'Error', noindex: true, body: `<div class="wrap" style="padding:60px 0;"><h1>Something went wrong</h1><p class="muted">Please try again in a moment.</p></div>`, business: ctx.business }));
  }
}

const server = http.createServer((req, res) => {
  router(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) { res.statusCode = 500; res.end('Internal error'); }
  });
});

server.listen(PORT, () => {
  console.log(`Layered running at http://localhost:${PORT}`);
  startPublisher();
});
