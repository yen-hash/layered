// db.js — SQLite data layer using Node's built-in node:sqlite (no npm dependency).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'app.db');
export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    contact_name TEXT,
    property_types TEXT DEFAULT '',
    styles TEXT DEFAULT '',
    service_areas TEXT DEFAULT 'Islandwide',
    bio TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    notify_email INTEGER DEFAULT 1,
    notify_sms INTEGER DEFAULT 0,
    notify_phone TEXT DEFAULT '',
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    property_type TEXT DEFAULT '',
    style TEXT DEFAULT '',
    description TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    property_type TEXT,
    style TEXT,
    budget_range TEXT,
    location TEXT,
    message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lead_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_lead_matches_business ON lead_matches(business_id);
  CREATE INDEX IF NOT EXISTS idx_lead_matches_lead ON lead_matches(lead_id);
`);

export const PROPERTY_TYPES = ['HDB', 'Condo', 'Landed', 'Commercial'];
export const STYLES = ['Minimalist', 'Scandinavian', 'Industrial', 'Modern', 'Contemporary', 'Classic'];
export const BUDGET_RANGES = ['Below $20k', '$20k - $50k', '$50k - $100k', 'Above $100k'];

export function slugify(str) {
  const base = str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = base || 'business';
  let n = 1;
  while (db.prepare('SELECT id FROM businesses WHERE slug = ?').get(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
