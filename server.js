const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'out');

// Load env for remove.bg API key
let REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const match = envFile.match(/REMOVE_BG_API_KEY=(.+)/);
  if (match) REMOVE_BG_API_KEY = match[1].trim();
} catch {}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

function serveStatic(filePath, res) {
  if (!filePath) return false;

  const fullPath = path.join(STATIC_DIR, filePath);
  if (!fullPath.startsWith(STATIC_DIR)) return false;
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) return false;

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const data = fs.readFileSync(fullPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(data);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: remove background
  if (url.pathname === '/api/remove-bg' && req.method === 'POST') {
    if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY === 'your_api_key_here') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Remove.bg API key not configured. Set REMOVE_BG_API_KEY in .env.local' }));
      return;
    }

    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks);

      // Parse multipart/form-data
      const boundary = req.headers['content-type']?.split('boundary=')[1];
      if (!boundary) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request format' }));
        return;
      }

      // Extract file from multipart
      const boundaryBuf = Buffer.from('--' + boundary);
      const parts = [];
      let start = 0;
      while (true) {
        const idx = rawBody.indexOf(boundaryBuf, start);
        if (idx === -1) break;
        if (start > 0) parts.push(rawBody.slice(start, idx));
        start = idx + boundaryBuf.length;
      }

      let fileData = null;
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const header = part.slice(0, headerEnd).toString();
        if (header.includes('name="image_file"')) {
          fileData = part.slice(headerEnd + 4, part.length - 2); // remove trailing \r\n
          break;
        }
      }

      if (!fileData) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No image file provided' }));
        return;
      }

      // Build form-data for remove.bg
      const bgBoundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      const bgBody = Buffer.concat([
        Buffer.from(`--${bgBoundary}\r\nContent-Disposition: form-data; name="image_file"; filename="image.png"\r\nContent-Type: application/octet-stream\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${bgBoundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\nauto\r\n--${bgBoundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng\r\n--${bgBoundary}--\r\n`),
      ]);

      const bgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
          'Content-Type': `multipart/form-data; boundary=${bgBoundary}`,
        },
        body: bgBody,
      });

      if (!bgRes.ok) {
        const errText = await bgRes.text();
        console.error('remove.bg error:', bgRes.status, errText);
        res.writeHead(bgRes.status >= 500 ? 502 : bgRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: bgRes.status === 402 || bgRes.status === 429
            ? 'API quota exceeded. Please try again later.'
            : `Background removal failed (${bgRes.status}). Please try again.`
        }));
        return;
      }

      const resultBuf = Buffer.from(await bgRes.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      });
      res.end(resultBuf);
    } catch (err) {
      console.error('API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error: ' + err.message }));
    }
    return;
  }

  // Static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;

  // Try exact path first
  if (serveStatic(filePath, res)) return;

  // Try with .html extension
  if (!path.extname(filePath) && serveStatic(filePath + '.html', res)) return;

  // Try under _next
  if (serveStatic(filePath, res)) return;

  // Fallback to 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving: ${STATIC_DIR}`);
  console.log(`🔑 API Key: ${REMOVE_BG_API_KEY ? 'configured' : 'NOT SET'}`);
});
