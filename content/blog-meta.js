// Blog categories (slug -> display name). Each gets its own indexable archive page.
export const BLOG_CATEGORIES = [
  { slug: 'costs-and-budgeting', name: 'Costs & Budgeting', blurb: 'What renovations really cost in Singapore, what drives the price, and how to budget without surprises.' },
  { slug: 'rules-and-permits', name: 'Rules & Permits', blurb: 'HDB permits, condo approvals, working hours and the checks to make before work starts.' },
  { slug: 'choosing-a-designer', name: 'Choosing a Designer', blurb: 'How to compare interior designers, platforms and quotes, and avoid the common traps.' },
  { slug: 'design-ideas', name: 'Design Ideas', blurb: 'Styles, layouts and inspiration for HDB, condo and landed homes in Singapore.' },
];
export const categoryByName = (name) => BLOG_CATEGORIES.find((c) => c.name === name) || null;
export const categoryBySlug = (slug) => BLOG_CATEGORIES.find((c) => c.slug === slug) || null;
// Fallback covers by category (resized copies of the site's photography).
export const CATEGORY_COVERS = {
  'Costs & Budgeting': '/images/cover-costs.jpg',
  'Rules & Permits': '/images/cover-rules.jpg',
  'Choosing a Designer': '/images/cover-choose.jpg',
  'Design Ideas': '/images/cover-design.jpg',
};
