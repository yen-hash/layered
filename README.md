# Layered

A lead-generation platform for interior designers, in the spirit of Hometrust:
homeowners submit a project brief and get matched to designer firms; each firm
gets a business control panel to manage its public profile, project gallery,
and incoming leads.

**Zero npm dependencies.** Everything runs on Node's built-in modules —
`node:http` for the server, `node:sqlite` for the database, `node:crypto` for
auth. `npm install` has nothing to install; `npm start` just runs `node
server.js`. This was a deliberate choice for this build environment (no
registry access), but it also means there's nothing to break on `npm audit`,
no dependency updates to chase, and it runs anywhere with Node ≥ 22.5.

## What's built

- **Public site**: homepage, designer directory with filters (property type,
  style), designer profile pages with project galleries, and a lead capture
  form ("Get My Recommendations").
- **Lead routing**: every submitted lead is matched against designers whose
  `property_types` overlap the homeowner's request (falls back to featured/
  recent designers if nothing matches), inserted into each matched business's
  dashboard, and a notification is dispatched per business.
- **Notifications**: email and WhatsApp/SMS dispatch, each with a working
  no-config "log driver" (writes to `data/notifications.log` and stdout) and
  a real-provider path that activates the moment you set env vars — no code
  changes needed. See **Wiring up real notifications** below.
- **Business control panel**: signup/login (scrypt-hashed passwords, signed
  session cookies), dashboard overview with KPIs, profile editor (property
  types, styles, service area, bio, logo, notification preferences), project
  manager (create/delete, with real photo upload via multipart form-data or
  a pasted image URL), and a leads inbox with a detail view and status
  tracker (new / contacted / won / lost).
- **Credentials**: firms can list their HDB renovation contractor licence number
  and one CaseTrust accreditation (CaseTrust, CaseTrust-RCMA, or CaseTrust Gold).
  They show as badges on directory cards and a Credentials panel on the profile, and
  the directory can be filtered by them. They are self-declared and labelled as
  such, with links to HDB's and CaseTrust's own lookups; Layered does not verify them.
- **SEO**: keyword-targeted landing pages by property type and style
  (`/interior-designers/hdb`, `/condo`, `/landed`, `/commercial`, `/style/*`), renovation
  guides (`/guides/*`), canonical URLs, Open Graph, structured data (Organization,
  Breadcrumb, Article, FAQPage, ItemList, HomeAndConstructionBusiness), `robots.txt`, a
  dynamic `sitemap.xml`, gzip and caching. See `docs/SEO.md` for the audit, keyword map and
  action plan, and run `node scripts/seo-check.js <base-url>` to check every page.
- **Blog**: `/blog` with categories, RSS and an admin editor at `/dashboard/blog` (Markdown, live SEO
  scorecard, draft/publish). Admins are accounts whose login email is in `ADMIN_EMAILS`. The first
  `npm start` publishes six launch articles; after that the posts belong to the editor.
- **Renovation checklist**: `/guides/renovation-checklist-singapore`, a tickable, printable homeowner guide
  whose progress is saved in the visitor's own browser.
- **Cost calculator**: `/tools/renovation-cost-calculator` estimates HDB, condo, kitchen and bathroom
  or office renovation budgets from the 2026 ranges in `content/estimator.js`, then hands the property
  type and budget band to the brief form. `npm test` runs the unit tests (estimator maths, Markdown safety).
- Ownership is enforced everywhere in the dashboard — a business can only see
  and edit its own leads and projects.

## Getting started

```bash
npm run seed   # optional: adds 4 sample designer firms + projects
npm start      # or: npm run dev  (auto-restarts on file changes)
```

Visit `http://localhost:3000`. Seeded business logins (if you ran the seed
script) all use password `password123`, e.g. `hello@northgate.example`.

The SQLite file lives at `data/app.db` (created automatically). Delete it to
reset the database.

## Wiring up real notifications

Nothing needs to change in the code — `lib/notify.js` reads these at runtime:

**Email** (via [Resend](https://resend.com), a simple HTTPS API — no SDK):
```
RESEND_API_KEY=re_xxx
EMAIL_FROM=leads@yourdomain.com
```

**WhatsApp/SMS** (via [Twilio](https://twilio.com)):
```
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM=whatsapp:+14155238886   # or a plain SMS-capable number
```

Each business also needs "Email me new leads" / "WhatsApp/SMS me new leads"
turned on in their dashboard profile (email is on by default; SMS needs a
phone number on file).

Without these env vars, everything still works — notifications just get
logged instead of sent, so you can develop and demo without any API keys.

## Deploying

This app needs a host that runs a persistent Node process with a writable
filesystem, because:
1. It's a long-running `http.createServer`, not serverless functions.
2. `data/app.db` (SQLite) and `public/uploads/` (photos) need to persist on
   disk between requests.

That rules out Vercel/Netlify in their default serverless mode. Good fits:

- **Railway** or **Render** — connect the GitHub repo, set the start command
  to `npm start`, attach a small persistent volume mounted at `/data` and
  set `DB_PATH=/data/app.db` (and point uploads there too, or just use the
  default `public/uploads` if the platform's disk persists across deploys).
- **Fly.io** — same idea, with a Fly Volume.
- **A basic VPS** (DigitalOcean, EC2, etc.) — clone the repo, `npm start`
  behind a process manager (pm2/systemd) and a reverse proxy (Caddy/nginx)
  for TLS.

Environment variables to set in production:
```
SESSION_SECRET=<long random string>   # required — signs login sessions
SITE_URL=https://www.example.sg       # required for SEO — canonical URLs, sitemap, structured data
ADMIN_EMAILS=you@example.com          # who may use /dashboard/blog (comma-separated; required in production)
NODE_ENV=production                   # marks cookies Secure
PORT=3000                             # or whatever your host expects
RESEND_API_KEY=...                    # optional, see above
TWILIO_ACCOUNT_SID=...                # optional, see above
```

### If you outgrow SQLite

The whole data layer is one file (`db.js`) with plain SQL. If you later need
multiple app instances behind a load balancer, swap in a hosted Postgres
(e.g. Supabase or Neon) — the query shapes barely change, you'd mainly swap
`node:sqlite`'s `db.prepare(...).run/get/all` calls for a Postgres client's
equivalents.

## Project structure

```
server.js            HTTP server + routing
db.js                 SQLite schema, connection, constants
lib/auth.js            password hashing, signed session cookies
lib/body.js             request body parsing (urlencoded + multipart uploads)
lib/notify.js            email/SMS dispatch (log driver + Resend/Twilio)
lib/render.js             HTML layout + escaping helpers
routes/public.js           homepage, directory, designer profile, lead intake
routes/auth.js               signup / login / logout
routes/dashboard.js            business control panel (profile, projects, leads)
public/style.css               all styling (no CSS framework)
public/uploads/                 uploaded project photos (gitignored)
scripts/seed.js                  sample data for local development
data/app.db                       SQLite database (gitignored, auto-created)
```

## Known limitations (by design, for an MVP)

- No payment/subscription tiers for designers — every listed business is
  equal; `featured` is a manual DB flag for now.
- No identity verification for businesses signing up.
- Lead matching is a simple property-type overlap, not a scoring algorithm.
- Photo uploads are stored on local disk, which won't survive on ephemeral/
  serverless filesystems — see the deploy notes above.

## Verifying credentials

Admins (`ADMIN_EMAILS`) open `/dashboard/verification`, check each firm's HDB licence / CaseTrust against the official lookups, and click Verify. The checked value and date are stored; changing the declared value, or 365 days passing, removes the tick automatically. Unchecked credentials stay labelled self-declared.

## Shortlist and compare

Visitors save up to four designers with the heart button (stored in their browser only) and open `/compare` to see service areas, styles, credentials (with checked dates) and project counts side by side. The page is `noindex`.
