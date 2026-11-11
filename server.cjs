/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Standalone Backend Server (Port 5000)
 *
 * Usage:
 *   node server.cjs
 */

const http = require('http');
const { handleApiRequest } = require('./backend/apiEngine.cjs');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    return handleApiRequest(req, res);
  }

  // Root health probe
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body style="font-family: sans-serif; padding: 2rem; background: #0F172A; color: #FFFFFF;">
        <h1 style="color: #818CF8;">Kongu Engineering College - Project Evaluation Backend API</h1>
        <p>✅ Server is running actively on port <strong>${PORT}</strong></p>
        <ul>
          <li><a style="color: #38BDF8;" href="/api/health">/api/health</a> - Health & Record Counts</li>
          <li><a style="color: #38BDF8;" href="/api/data">/api/data</a> - Complete Project & Evaluation Database</li>
          <li><code>/api/realtime</code> - Server-Sent Events (SSE) Realtime Stream</li>
        </ul>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log(`🚀 KEC IT Project Evaluation Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Realtime Stream: http://localhost:${PORT}/api/realtime`);
  console.log('='.repeat(70));
});
