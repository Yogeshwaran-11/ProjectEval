/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Unified Production Server (Port 5000 / $PORT)
 *
 * Serves:
 * 1. REST API & SSE Realtime Stream at /api/...
 * 2. Static Production Frontend Assets from dist/ (SPA Routing fallback to index.html)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRequest } = require('./backend/apiEngine.cjs');

const PORT = process.env.PORT || 5000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // 1. API routes
  if (req.url.startsWith('/api')) {
    return handleApiRequest(req, res);
  }

  // 2. Static frontend serving if dist/ exists
  if (fs.existsSync(DIST_DIR)) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let reqPath = parsedUrl.pathname;

    let filePath = path.join(DIST_DIR, reqPath);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA Fallback: serve dist/index.html
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      return fs.createReadStream(indexPath).pipe(res);
    }
  }

  // 3. Fallback information page if dist/ hasn't been built yet
  res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
  res.end(`
    <html>
      <body style="font-family: sans-serif; padding: 2rem; background: #0F172A; color: #FFFFFF;">
        <h1 style="color: #818CF8;">Kongu Engineering College - Project Evaluation Portal</h1>
        <p>✅ Server is running actively on port <strong>${PORT}</strong></p>
        <p style="color: #94A3B8;">Frontend build not detected. Run <code>npm run build</code> to serve the web UI.</p>
        <ul>
          <li><a style="color: #38BDF8;" href="/api/health">/api/health</a> - API Health Check</li>
          <li><a style="color: #38BDF8;" href="/api/data">/api/data</a> - Complete Project & Evaluation Database</li>
          <li><code>/api/realtime</code> - Server-Sent Events (SSE) Stream</li>
        </ul>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log(`🚀 KEC IT Project Evaluation Server is live!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Realtime Stream: http://localhost:${PORT}/api/realtime`);
  console.log('='.repeat(70));
});
