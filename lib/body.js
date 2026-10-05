// lib/body.js — request body parsing (urlencoded forms, JSON, and multipart/form-data
// for project photo uploads) using only Node's stdlib.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BODY = 48 * 1024 * 1024; // whole-request cap (up to 12 photos of at most 8MB each)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Parses application/x-www-form-urlencoded bodies into a plain object.
// Repeated keys (e.g. checkbox groups) become arrays.
export async function parseUrlEncoded(req) {
  const raw = await readRawBody(req);
  const params = new URLSearchParams(raw.toString('utf8'));
  const out = {};
  for (const [k, v] of params) {
    if (out[k] === undefined) out[k] = v;
    else if (Array.isArray(out[k])) out[k].push(v);
    else out[k] = [out[k], v];
  }
  return out;
}

// Parses multipart/form-data into { fields, files }.
// files[fieldName] = [{ filename, mimetype, savedPath, publicPath }]
const IMAGE_TYPES = {
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.gif': (b) => ['GIF87a', 'GIF89a'].includes(b.slice(0, 6).toString('latin1')),
  '.webp': (b) => b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP',
};
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 12;

// True only for real raster images with a whitelisted extension (no SVG/HTML, which can run script).
export function isSafeImage(filename, content) {
  const ext = path.extname(String(filename)).toLowerCase();
  const check = IMAGE_TYPES[ext];
  return Boolean(check && content.length > 12 && content.length <= MAX_IMAGE_BYTES && check(content));
}

// opts.allowFiles: only routes that expect uploads (and are behind login) pass true. Everywhere else, file
// parts are discarded so nobody can write to disk through, say, the public enquiry form.
export async function parseMultipart(req, contentType, opts = {}) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
  if (!boundary) throw new Error('Missing multipart boundary');

  const raw = await readRawBody(req);
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};
  const rejected = [];
  let fileCount = 0;

  let start = raw.indexOf(boundaryBuf);
  while (start !== -1) {
    const nextStart = raw.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (nextStart === -1) break;
    let part = raw.slice(start + boundaryBuf.length, nextStart);
    // strip leading CRLF and trailing CRLF before next boundary
    if (part.slice(0, 2).toString() === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headerText = part.slice(0, headerEnd).toString('utf8');
      const content = part.slice(headerEnd + 4);

      const nameMatch = /name="([^"]+)"/i.exec(headerText);
      const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
      const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
      const fieldName = nameMatch ? nameMatch[1] : null;

      if (fieldName) {
        if (filenameMatch && filenameMatch[1]) {
          const originalName = filenameMatch[1];
          if (!opts.allowFiles) { start = nextStart; continue; }
          if (!isSafeImage(originalName, content) || fileCount >= MAX_FILES) { rejected.push(originalName); start = nextStart; continue; }
          fileCount += 1;
          const ext = path.extname(originalName).toLowerCase();
          const safeExt = ext;
          const savedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
          const savedPath = path.join(UPLOAD_DIR, savedName);
          fs.writeFileSync(savedPath, content);
          files[fieldName] = files[fieldName] || [];
          files[fieldName].push({
            filename: originalName,
            mimetype: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
            savedPath,
            publicPath: `/uploads/${savedName}`,
            size: content.length,
          });
        } else {
          const val = content.toString('utf8');
          if (fields[fieldName] === undefined) fields[fieldName] = val;
          else if (Array.isArray(fields[fieldName])) fields[fieldName].push(val);
          else fields[fieldName] = [fields[fieldName], val];
        }
      }
    }
    start = nextStart;
  }

  return { fields, files, rejected };
}

// Convenience: parses either urlencoded or multipart depending on Content-Type,
// always returning { fields, files }.
export async function parseForm(req, opts = {}) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return parseMultipart(req, contentType, opts);
  }
  const fields = await parseUrlEncoded(req);
  return { fields, files: {} };
}
