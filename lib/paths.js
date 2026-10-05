// lib/paths.js — where uploaded files live. Set UPLOAD_DIR to a persistent disk in production (e.g. /var/data/uploads);
// the default keeps them inside the app folder. Files bundled with the repo under public/uploads are still served.
import path from 'node:path';
import fs from 'node:fs';

export const PUBLIC_DIR = path.join(process.cwd(), 'public');
export const BUNDLED_UPLOADS = path.join(PUBLIC_DIR, 'uploads');
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || BUNDLED_UPLOADS);
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Maps a public URL like /uploads/abc.jpg to a file path inside UPLOAD_DIR, or '' if it escapes the folder.
export function uploadFileFor(urlPath) {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/uploads/')) return '';
  const file = path.join(UPLOAD_DIR, urlPath.slice('/uploads/'.length));
  return file.startsWith(UPLOAD_DIR + path.sep) ? file : '';
}
