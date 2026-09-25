// lib/body.js — request body parsing (urlencoded forms, JSON, and multipart/form-data
// for project photo uploads) using only Node's stdlib.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BODY = 15 * 1024 * 1024; // 15MB cap (photos)
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
export async function parseMultipart(req, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
  if (!boundary) throw new Error('Missing multipart boundary');

  const raw = await readRawBody(req);
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};

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
          const ext = path.extname(originalName).slice(0, 10) || '';
          const safeExt = /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : '';
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

  return { fields, files };
}

// Convenience: parses either urlencoded or multipart depending on Content-Type,
// always returning { fields, files }.
export async function parseForm(req) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return parseMultipart(req, contentType);
  }
  const fields = await parseUrlEncoded(req);
  return { fields, files: {} };
}
