/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Native Backend REST & Realtime Event Engine
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(__dirname, '../data/db.json');

// In-memory cache synced with disk
let db = null;
const sseClients = new Set();

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(raw);
    } else {
      console.warn('⚠️ db.json not found, initializing empty structure');
      db = { institution: {}, reviewRounds: [], rubrics: {}, users: [], teams: [], panels: [], evaluations: [] };
    }
  } catch (err) {
    console.error('Error loading db.json:', err);
    db = { institution: {}, reviewRounds: [], rubrics: {}, users: [], teams: [], panels: [], evaluations: [] };
  }
}

function saveDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Initial load
loadDb();

/**
 * Broadcast an event to all connected Server-Sent Events (SSE) clients.
 */
function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

/**
 * Unified request router for Node HTTP server or Vite dev server middleware.
 */
async function handleApiRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const [urlPath] = req.url.split('?');

  // 1. SSE Realtime Stream
  if (urlPath === '/api/realtime' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('event: connected\ndata: {"status":"ok"}\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. Health Check
  if (urlPath === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'online',
      institution: db.institution?.name || 'Kongu Engineering College',
      activeClients: sseClients.size,
      records: {
        panels: db.panels.length,
        teams: db.teams.length,
        evaluations: db.evaluations.length,
        users: db.users.length
      }
    });
  }

  // 3. Full Data Fetch
  if (urlPath === '/api/data' && req.method === 'GET') {
    return sendJson(res, 200, db);
  }

  // 4. Authentication Verification
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    const { identifier } = await parseBody(req);
    const trimmed = (identifier || '').trim().toLowerCase();

    const matched = db.users.find(u => {
      const matchRoll = u.rollNo && u.rollNo.toLowerCase() === trimmed;
      const matchEmp = u.empId && u.empId.toLowerCase() === trimmed;
      const matchEmail = u.email && u.email.toLowerCase() === trimmed;
      const matchName = u.name && u.name.toLowerCase().includes(trimmed);
      return matchRoll || matchEmp || matchEmail || matchName;
    });

    if (matched) {
      return sendJson(res, 200, { success: true, user: matched });
    }
    return sendJson(res, 401, { success: false, message: 'Invalid credentials or user not found in department directory' });
  }

  // 5. Trigger Standby Alert
  if (urlPath === '/api/panels/standby' && req.method === 'POST') {
    const { panelId, targetTeamId, message, timeStr, updatedQueue } = await parseBody(req);
    const panel = db.panels.find(p => p.id === panelId);
    if (panel) {
      panel.standbyTeamId = targetTeamId;
      panel.lastStandbyAlert = message;
      panel.alertTimestamp = timeStr;
      if (updatedQueue) panel.teamQueue = updatedQueue;
      saveDb();

      const notification = {
        type: 'standby',
        title: '🚨 Standby Alert Triggered',
        message,
        targetTeamId,
        timestamp: timeStr
      };

      broadcast('STANDBY_ALERT', {
        panelId,
        targetTeamId,
        msg: message,
        timeStr,
        notification,
        updatedPanels: db.panels
      });

      return sendJson(res, 200, { success: true, panel });
    }
    return sendJson(res, 404, { error: 'Panel not found' });
  }

  // 6. Advance Viva Queue
  if (urlPath === '/api/panels/advance' && req.method === 'POST') {
    const { panelId, nextActiveId, queue } = await parseBody(req);
    const panel = db.panels.find(p => p.id === panelId);
    if (panel) {
      panel.activeTeamId = nextActiveId;
      panel.standbyTeamId = null;
      if (queue) panel.teamQueue = queue;
      saveDb();

      broadcast('QUEUE_ADVANCED', {
        panelId,
        nextActiveId,
        updatedPanels: db.panels
      });

      return sendJson(res, 200, { success: true, panel });
    }
    return sendJson(res, 404, { error: 'Panel not found' });
  }

  // 7. Save / Lock Evaluation
  if (urlPath === '/api/evaluations' && req.method === 'POST') {
    const { evaluation, progressPercentage } = await parseBody(req);
    const existingIdx = db.evaluations.findIndex(
      e => e.panelId === evaluation.panelId &&
           e.teamId === evaluation.teamId &&
           e.reviewRoundId === evaluation.reviewRoundId &&
           e.juryId === evaluation.juryId
    );

    if (existingIdx !== -1) {
      db.evaluations[existingIdx] = evaluation;
    } else {
      db.evaluations.push(evaluation);
    }

    if (progressPercentage !== undefined) {
      const team = db.teams.find(t => t.id === evaluation.teamId);
      if (team) team.progressPercentage = progressPercentage;
    }

    saveDb();

    broadcast('EVALUATION_SAVED', {
      updatedEvaluations: db.evaluations,
      updatedTeams: db.teams
    });

    return sendJson(res, 200, { success: true, evaluation });
  }

  // 8. Update Student Deliverables (GitHub, PPT, Demo)
  if (urlPath.startsWith('/api/teams/') && req.method === 'PUT') {
    const teamId = urlPath.replace('/api/teams/', '');
    const fields = await parseBody(req);
    const team = db.teams.find(t => t.id === teamId);
    if (team) {
      Object.assign(team, fields);
      saveDb();

      broadcast('TEAM_UPDATED', {
        teamId,
        updatedTeam: team,
        updatedTeams: db.teams
      });

      return sendJson(res, 200, { success: true, team });
    }
    return sendJson(res, 404, { error: 'Team not found' });
  }

  // 9. Update Rubrics (Admin Only)
  if (urlPath === '/api/rubrics' && req.method === 'PUT') {
    const { roundId, rubricsList } = await parseBody(req);
    db.rubrics[roundId] = rubricsList;
    saveDb();

    broadcast('RUBRICS_UPDATED', {
      roundId,
      updatedRubrics: db.rubrics
    });

    return sendJson(res, 200, { success: true, rubrics: db.rubrics });
  }

  // 10. Update Venue
  if (urlPath === '/api/panels/venue' && req.method === 'POST') {
    const { panelId, venue } = await parseBody(req);
    const panel = db.panels.find(p => p.id === panelId);
    if (panel) {
      panel.venue = venue;
      saveDb();
      broadcast('PANEL_VENUE_UPDATED', { updatedPanels: db.panels });
      return sendJson(res, 200, { success: true, panel });
    }
    return sendJson(res, 404, { error: 'Panel not found' });
  }

  // 404 for unknown endpoints
  sendJson(res, 404, { error: 'Endpoint not found', path: urlPath });
}

module.exports = {
  handleApiRequest,
  broadcast,
  getDb: () => db
};
