// scripts/seed.js — populates a few sample designer businesses & projects so the
// directory and homepage aren't empty on first run. Safe to re-run (skips if data exists).
import { db, slugify } from '../db.js';
import { hashPassword } from '../lib/auth.js';

const existing = db.prepare('SELECT COUNT(*) c FROM businesses').get().c;
if (existing > 0) {
  console.log(`Skipping seed — ${existing} business(es) already in the database.`);
  process.exit(0);
}

const sample = [
  {
    company_name: 'Carpenters 匠', email: 'yenlauzengbin@gmail.com', contact_name: 'Carpenters Team',
    phone: '+65 8774 8495', property_types: 'HDB,Condo,Landed,Commercial', styles: 'Minimalist,Industrial,Contemporary',
    service_areas: 'Islandwide (East & West showrooms)', featured: 1,
    bio: 'Carpenters blends generations of carpentry knowledge with a contemporary design practice — we have renovated over 3,500 homes since the 1950s, working out of our own in-house carpentry facility. We take on HDB, condo, landed and commercial projects, with a focus on bespoke joinery, Japandi and minimalist-industrial interiors, and considered detailing from concept through completion.',
    passwordHash: 'e4e5b6b2019a5758bb26f98c05108672:8b27477472fba69749d96ef39f93ca4d91342dfeeeebde4fe41029adaf866f67843dc9f3382b3bde87a6e64344bdf2c187d4f32651abb24f22c72f4df9259297',
    projects: [],
  },
  {
    company_name: 'Northgate Design Studio', email: 'hello@northgate.example', contact_name: 'Wei Ming',
    phone: '+65 8123 4567', property_types: 'HDB,Condo', styles: 'Minimalist,Scandinavian',
    service_areas: 'Islandwide', featured: 1,
    bio: 'We specialize in clean, functional renovations for HDB and condo homeowners who want a calm, clutter-free space.',
    projects: [
      { title: '4-Room HDB, Punggol', property_type: 'HDB', style: 'Minimalist', description: 'Full renovation with open-concept kitchen.' },
      { title: 'Condo Reno, Bishan', property_type: 'Condo', style: 'Scandinavian', description: 'Light wood tones and built-in storage throughout.' },
    ],
  },
  {
    company_name: 'Ironline Interiors', email: 'studio@ironline.example', contact_name: 'Sarah Tan',
    phone: '+65 8234 5678', property_types: 'Condo,Landed,Commercial', styles: 'Industrial,Modern',
    service_areas: 'Islandwide', featured: 1,
    bio: 'Bold, material-driven interiors for condos, landed homes and commercial fit-outs.',
    projects: [
      { title: 'Landed Home, Bukit Timah', property_type: 'Landed', style: 'Industrial', description: 'Exposed brick and black steel accents.' },
      { title: 'Cafe Fit-out, Tiong Bahru', property_type: 'Commercial', style: 'Industrial', description: 'Warm industrial cafe interior.' },
    ],
  },
  {
    company_name: 'Warmhaus Living', email: 'contact@warmhaus.example', contact_name: 'Daniel Goh',
    phone: '+65 8345 6789', property_types: 'HDB,Condo,Landed', styles: 'Contemporary,Classic',
    service_areas: 'Islandwide',
    bio: 'Timeless, comfortable interiors that age well — a mix of contemporary and classic details.',
    projects: [
      { title: '5-Room HDB, Tampines', property_type: 'HDB', style: 'Contemporary', description: 'Family-friendly layout with a reading nook.' },
    ],
  },
  {
    company_name: 'Studio Aster', email: 'team@studioaster.example', contact_name: 'Mei Lin',
    phone: '+65 8456 7890', property_types: 'Condo', styles: 'Modern,Minimalist',
    service_areas: 'East & Central',
    bio: 'Modern condo interiors with a focus on natural light and smart storage.',
    projects: [
      { title: 'Condo, Marine Parade', property_type: 'Condo', style: 'Modern', description: 'Floor-to-ceiling windows, minimal palette.' },
    ],
  },
];

const insertBusiness = db.prepare(`INSERT INTO businesses (slug, company_name, email, password_hash, phone, contact_name, property_types, styles, service_areas, bio, featured, notify_phone)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertProject = db.prepare(`INSERT INTO projects (business_id, title, property_type, style, description) VALUES (?, ?, ?, ?, ?)`);

for (const s of sample) {
  const slug = slugify(s.company_name);
  const passwordHash = s.passwordHash || hashPassword('password123');
  const info = insertBusiness.run(
    slug, s.company_name, s.email, passwordHash, s.phone, s.contact_name,
    s.property_types, s.styles, s.service_areas, s.bio, s.featured ? 1 : 0, s.phone
  );
  for (const p of s.projects) {
    insertProject.run(info.lastInsertRowid, p.title, p.property_type, p.style, p.description);
  }
  console.log(`Seeded ${s.company_name} (login: ${s.email}${s.passwordHash ? '' : ' / password123'})`);
}

console.log('Done.');
