/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Frontend API Client (REST & Server-Sent Events)
 */

const API_BASE = ''; // Same origin (relative URL)

export async function apiFetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { online: false };
    return await res.json();
  } catch {
    return { online: false };
  }
}

export async function apiFetchAllData() {
  try {
    const res = await fetch(`${API_BASE}/api/data`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('apiFetchAllData failed:', err);
    return null;
  }
}

export async function apiLogin(identifier, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function apiSendStandbyAlert(panelId, targetTeamId, message, timeStr, updatedQueue) {
  try {
    await fetch(`${API_BASE}/api/panels/standby`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelId, targetTeamId, message, timeStr, updatedQueue })
    });
  } catch (err) {
    console.warn('apiSendStandbyAlert error:', err);
  }
}

export async function apiAdvanceQueue(panelId, nextActiveId, queue) {
  try {
    await fetch(`${API_BASE}/api/panels/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelId, nextActiveId, queue })
    });
  } catch (err) {
    console.warn('apiAdvanceQueue error:', err);
  }
}

export async function apiSaveEvaluation(evaluation, progressPercentage) {
  try {
    await fetch(`${API_BASE}/api/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluation, progressPercentage })
    });
  } catch (err) {
    console.warn('apiSaveEvaluation error:', err);
  }
}

export async function apiUpdateTeamDeliverables(teamId, fields) {
  try {
    await fetch(`${API_BASE}/api/teams/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
  } catch (err) {
    console.warn('apiUpdateTeamDeliverables error:', err);
  }
}

export async function apiUpdateRubrics(roundId, rubricsList) {
  try {
    await fetch(`${API_BASE}/api/rubrics`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, rubricsList })
    });
  } catch (err) {
    console.warn('apiUpdateRubrics error:', err);
  }
}

export async function apiUpdatePanelVenue(panelId, venue) {
  try {
    await fetch(`${API_BASE}/api/panels/venue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelId, venue })
    });
  } catch (err) {
    console.warn('apiUpdatePanelVenue error:', err);
  }
}

/**
 * Server-Sent Events (SSE) Realtime Stream Listener:
 * Enables real-time cross-device updates across phones, laptops, and tablets!
 */
export function setupSseRealtime(handlers) {
  if (typeof window === 'undefined' || !('EventSource' in window)) return null;

  try {
    const es = new EventSource(`${API_BASE}/api/realtime`);

    es.addEventListener('STANDBY_ALERT', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onStandbyAlert) handlers.onStandbyAlert(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    es.addEventListener('QUEUE_ADVANCED', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onQueueAdvanced) handlers.onQueueAdvanced(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    es.addEventListener('EVALUATION_SAVED', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onEvaluationSaved) handlers.onEvaluationSaved(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    es.addEventListener('TEAM_UPDATED', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onTeamUpdated) handlers.onTeamUpdated(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    es.addEventListener('RUBRICS_UPDATED', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onRubricsUpdated) handlers.onRubricsUpdated(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    es.addEventListener('PANEL_VENUE_UPDATED', e => {
      try {
        const data = JSON.parse(e.data);
        if (handlers.onVenueUpdated) handlers.onVenueUpdated(data);
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    });

    return () => {
      es.close();
    };
  } catch (err) {
    console.warn('Failed to connect to SSE stream:', err);
    return null;
  }
}
