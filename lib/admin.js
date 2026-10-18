// lib/admin.js — who may edit the blog. Admins are business accounts whose login email is in ADMIN_EMAILS
// (comma-separated). Outside production, if unset, a placeholder admin (admin@example.test) is used so the
// editor is usable locally; in production it must be set explicitly.
export function adminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? (process.env.NODE_ENV === 'production' ? '' : 'admin@example.test');
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export const isAdmin = (business) => Boolean(business) && adminEmails().includes(String(business.email).toLowerCase());
