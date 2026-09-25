import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from './db.js';
import { parseCookies, verifySessionToken } from './lib/auth.js';
import { parseForm } from './lib/body.js';
import { flashFromQuery, layout } from './lib/render.js';

import { homeRoute, directoryRoute, designerProfileRoute, submitLeadRoute } from './routes/public.js';
import { signupPage, signupSubmit, loginPage, loginSubmit, logoutRoute } from './routes/auth.js';
import {
  dashboardHome, profilePage, profileSubmit,
  projectsPage, projectCreate, projectDelete,
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

function serveStatic(req, res, url) {
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.statusCode = 403; res.end('Forbidden'); return true; }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

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

  if (req.method === 'GET' && (
    url.pathname === '/style.css' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/logo-mark.svg' ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/illustrations/')
  )) {
    if (serveStatic(req, res, url)) return;
  }

  const business = getSessionBusiness(req);
  const ctx = { business, flash: flashFromQuery(url.searchParams) };

  try {
    // ----- Public -----
    if (req.method === 'GET' && url.pathname === '/') return await homeRoute(req, res, ctx);
    if (req.method === 'GET' && url.pathname === '/designers') return await directoryRoute(req, res, ctx, url);
    if (req.method === 'GET' && url.pathname.startsWith('/designers/')) {
      const slug = url.pathname.split('/')[2];
      return await designerProfileRoute(req, res, ctx, slug);
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
        const { fields } = await parseForm(req);
        return await profileSubmit(req, res, ctx, fields);
      }
      if (req.method === 'GET' && url.pathname === '/dashboard/projects') return await projectsPage(req, res, ctx);
      if (req.method === 'POST' && url.pathname === '/dashboard/projects') {
        const { fields, files } = await parseForm(req);
        return await projectCreate(req, res, ctx, fields, files);
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
    res.end(layout({ title: 'Not found', body: '<div class="wrap" style="padding:60px 0;"><h1>404 — Page not found</h1><a href="/">Back home</a></div>', business: ctx.business }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(layout({ title: 'Error', body: `<div class="wrap" style="padding:60px 0;"><h1>Something went wrong</h1><p class="muted">${err.message}</p></div>`, business: ctx.business }));
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
});
