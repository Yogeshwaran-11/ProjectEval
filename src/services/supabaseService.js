/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Supabase Service Layer (Cloud Database & Realtime Sync)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Health check: Tests whether the configured Supabase endpoint is reachable.
 */
export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured || !supabase) {
    return { online: false, message: 'Supabase client not configured in .env' };
  }

  try {
    const { error } = await supabase
      .from('panels')
      .select('id')
      .limit(1);

    if (error) {
      return { online: false, message: error.message };
    }
    return { online: true, message: 'Connected to Supabase Cloud Database' };
  } catch (err) {
    return { online: false, message: err.message };
  }
}

/**
 * Fetches all core collections from Supabase Cloud to hydrate React state.
 */
export async function fetchAllCloudData() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [
      { data: rounds, error: roundsErr },
      { data: rubricsData, error: rubricsErr },
      { data: teamsData, error: teamsErr },
      { data: panelsData, error: panelsErr },
      { data: evalsData, error: evalsErr },
      { data: profilesData }
    ] = await Promise.all([
      supabase.from('review_rounds').select('*'),
      supabase.from('rubrics').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('panels').select('*'),
      supabase.from('evaluations').select('*'),
      supabase.from('profiles').select('*')
    ]);

    if (roundsErr || rubricsErr || teamsErr || panelsErr || evalsErr) {
      console.warn('⚠️ Supabase tables incomplete or not populated yet. Using local fallback.', {
        roundsErr, rubricsErr, teamsErr, panelsErr, evalsErr
      });
      return null;
    }

    // Format teams to match React state shape
    const formattedTeams = (teamsData || []).map(t => ({
      id: t.id,
      code: t.team_code,
      title: t.project_title,
      abstract: t.abstract || '',
      mentorId: t.mentor_id,
      mentorName: t.mentor_name,
      panelId: t.panel_id,
      githubUrl: t.github_url,
      pptUrl: t.ppt_url,
      demoUrl: t.demo_url,
      progressPercentage: t.progress_percentage || 70,
      members: Array.isArray(t.members) ? t.members : []
    }));

    // Format panels
    const formattedPanels = (panelsData || []).map(p => ({
      id: p.id,
      code: p.panel_code,
      name: p.name || p.panel_code,
      reviewRoundId: p.review_round_id,
      venue: p.venue,
      activeTeamId: p.active_team_id,
      standbyTeamId: p.standby_team_id,
      lastStandbyAlert: p.last_standby_alert,
      alertTimestamp: p.alert_timestamp,
      juries: Array.isArray(p.juries) ? p.juries : [],
      teamQueue: Array.isArray(p.team_queue) ? p.team_queue : []
    }));

    // Format rubrics grouped by roundId
    const formattedRubrics = {};
    (rubricsData || []).forEach(r => {
      const roundId = r.review_round_id;
      if (!formattedRubrics[roundId]) formattedRubrics[roundId] = [];
      formattedRubrics[roundId].push({
        id: r.id,
        title: r.title,
        desc: r.description || '',
        maxMarks: Number(r.max_marks) || 10
      });
    });

    // Format evaluations
    const formattedEvaluations = (evalsData || []).map(e => ({
      id: e.id,
      panelId: e.panel_id,
      teamId: e.team_id,
      reviewRoundId: e.review_round_id,
      juryId: e.jury_id,
      marks: e.marks || {},
      totalScore: Number(e.total_score) || 0,
      remarks: e.remarks || '',
      isLocked: Boolean(e.is_locked),
      submittedAt: e.submitted_at || ''
    }));

    return {
      reviewRounds: rounds,
      rubrics: Object.keys(formattedRubrics).length ? formattedRubrics : null,
      teams: formattedTeams.length ? formattedTeams : null,
      panels: formattedPanels.length ? formattedPanels : null,
      evaluations: formattedEvaluations,
      users: profilesData
    };
  } catch (err) {
    console.error('Error in fetchAllCloudData:', err);
    return null;
  }
}

/**
 * 1-Click Cloud Push: Seeds initial data into Supabase Cloud directly from React.
 */
export async function seedCloudFromInitialData({ reviewRounds, rubrics, teams, panels, evaluations, faculty }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Seed Review Rounds
  const roundsToUpsert = reviewRounds.map(r => ({
    id: r.id,
    round_code: r.code,
    name: r.name,
    academic_year: '2025-2026',
    max_score: r.maxMarks || 50,
    is_active: Boolean(r.isActive)
  }));
  await supabase.from('review_rounds').upsert(roundsToUpsert, { onConflict: 'id' });

  // 2. Seed Rubrics
  const rubricsToUpsert = [];
  Object.entries(rubrics).forEach(([roundId, list]) => {
    list.forEach((crit, idx) => {
      rubricsToUpsert.push({
        id: crit.id,
        review_round_id: roundId,
        criterion_code: `C${idx + 1}`,
        title: crit.title,
        description: crit.desc || '',
        max_marks: crit.maxMarks || 10
      });
    });
  });
  if (rubricsToUpsert.length) {
    await supabase.from('rubrics').upsert(rubricsToUpsert, { onConflict: 'id' });
  }

  // 3. Seed Faculty Profiles
  if (faculty && faculty.length) {
    const profilesToUpsert = faculty.map(f => ({
      id: f.id,
      email: f.email,
      full_name: f.name,
      role: f.isHOD ? 'super_admin' : 'jury',
      roll_or_emp_id: f.empId,
      department: 'Department of Information Technology',
      photo: f.photo || null
    }));
    await supabase.from('profiles').upsert(profilesToUpsert, { onConflict: 'id' });
  }

  // 4. Seed Teams
  const teamsToUpsert = teams.map(t => ({
    id: t.id,
    team_code: t.code,
    project_title: t.title,
    abstract: t.abstract || '',
    mentor_id: t.mentorId || null,
    mentor_name: t.mentorName || '',
    panel_id: t.panelId || null,
    github_url: t.githubUrl || '',
    ppt_url: t.pptUrl || '',
    demo_url: t.demoUrl || '',
    progress_percentage: t.progressPercentage || 70,
    members: t.members || []
  }));
  await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'id' });

  // 5. Seed Panels
  const panelsToUpsert = panels.map(p => ({
    id: p.id,
    panel_code: p.code,
    name: p.name || p.code,
    review_round_id: p.reviewRoundId || 'REV-2',
    venue: p.venue || '',
    active_team_id: p.activeTeamId || null,
    standby_team_id: p.standbyTeamId || null,
    last_standby_alert: p.lastStandbyAlert || null,
    alert_timestamp: p.alertTimestamp || null,
    juries: p.juries || [],
    team_queue: p.teamQueue || []
  }));
  await supabase.from('panels').upsert(panelsToUpsert, { onConflict: 'id' });

  // 6. Seed Evaluations
  if (evaluations && evaluations.length) {
    const evalsToUpsert = evaluations.map(e => ({
      id: e.id,
      panel_id: e.panelId,
      team_id: e.teamId,
      review_round_id: e.reviewRoundId,
      jury_id: e.juryId,
      marks: e.marks || {},
      total_score: e.totalScore || 0,
      remarks: e.remarks || '',
      is_locked: Boolean(e.isLocked),
      submitted_at: e.submittedAt || null
    }));
    await supabase.from('evaluations').upsert(evalsToUpsert, { onConflict: 'id' });
  }

  return { success: true, count: teams.length };
}

/**
 * DB Mutation: Trigger standby alert for upcoming team.
 */
export async function dbSendStandbyAlert(panelId, targetTeamId, message, timeStr, updatedQueue) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('panels').update({
      standby_team_id: targetTeamId,
      last_standby_alert: message,
      alert_timestamp: timeStr,
      team_queue: updatedQueue
    }).eq('id', panelId);
  } catch (err) {
    console.warn('dbSendStandbyAlert offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Advance viva queue and transition active team.
 */
export async function dbAdvanceQueue(panelId, nextActiveTeamId, updatedQueue) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('panels').update({
      active_team_id: nextActiveTeamId,
      standby_team_id: null,
      team_queue: updatedQueue
    }).eq('id', panelId);
  } catch (err) {
    console.warn('dbAdvanceQueue offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Update panel venue.
 */
export async function dbUpdatePanelVenue(panelId, newVenue) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('panels').update({ venue: newVenue }).eq('id', panelId);
  } catch (err) {
    console.warn('dbUpdatePanelVenue offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Update panel assigned juries.
 */
export async function dbUpdatePanelJuries(panelId, newJuries) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('panels').update({ juries: newJuries }).eq('id', panelId);
  } catch (err) {
    console.warn('dbUpdatePanelJuries offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Update panel team queue order/slots.
 */
export async function dbUpdatePanelQueue(panelId, newQueue) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('panels').update({ team_queue: newQueue }).eq('id', panelId);
  } catch (err) {
    console.warn('dbUpdatePanelQueue offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Save or update jury evaluation.
 */
export async function dbSaveEvaluation(evalData, progressPercentage) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('evaluations').upsert({
      id: evalData.id,
      panel_id: evalData.panelId,
      team_id: evalData.teamId,
      review_round_id: evalData.reviewRoundId,
      jury_id: evalData.juryId,
      marks: evalData.marks,
      total_score: evalData.totalScore,
      remarks: evalData.remarks,
      is_locked: evalData.isLocked,
      submitted_at: evalData.submittedAt
    }, { onConflict: 'id' });

    if (progressPercentage !== undefined) {
      await supabase.from('teams').update({
        progress_percentage: progressPercentage
      }).eq('id', evalData.teamId);
    }
  } catch (err) {
    console.warn('dbSaveEvaluation offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Update student deliverables triad.
 */
export async function dbUpdateDeliverables(teamId, updatedFields) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const fields = {};
    if (updatedFields.githubUrl !== undefined) fields.github_url = updatedFields.githubUrl;
    if (updatedFields.pptUrl !== undefined) fields.ppt_url = updatedFields.pptUrl;
    if (updatedFields.demoUrl !== undefined) fields.demo_url = updatedFields.demoUrl;
    if (updatedFields.title !== undefined) fields.project_title = updatedFields.title;
    if (updatedFields.abstract !== undefined) fields.abstract = updatedFields.abstract;
    if (updatedFields.progressPercentage !== undefined) fields.progress_percentage = updatedFields.progressPercentage;

    await supabase.from('teams').update(fields).eq('id', teamId);
  } catch (err) {
    console.warn('dbUpdateDeliverables offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Save rubric criterion updates.
 */
export async function dbSaveRubricCriterion(roundId, criterion) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('rubrics').upsert({
      id: criterion.id,
      review_round_id: roundId,
      title: criterion.title,
      description: criterion.desc || '',
      max_marks: criterion.maxMarks || 10
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('dbSaveRubricCriterion offline fallback:', err.message);
  }
}

/**
 * DB Mutation: Delete rubric criterion.
 */
export async function dbDeleteRubricCriterion(criterionId) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('rubrics').delete().eq('id', criterionId);
  } catch (err) {
    console.warn('dbDeleteRubricCriterion offline fallback:', err.message);
  }
}

/**
 * Real-Time Subscriptions: Listens to PostgreSQL change stream via WebSockets.
 */
export function setupSupabaseRealtimeSubscriptions(handlers) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase
      .channel('kec_portal_realtime_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panels' }, payload => {
        if (handlers.onPanelChange) handlers.onPanelChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, payload => {
        if (handlers.onEvaluationChange) handlers.onEvaluationChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
        if (handlers.onTeamChange) handlers.onTeamChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rubrics' }, payload => {
        if (handlers.onRubricChange) handlers.onRubricChange(payload);
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 Subscribed to Supabase Realtime channel: kec_portal_realtime_stream');
        }
        if (err) {
          console.warn('Supabase Realtime subscription status:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to setup Supabase Realtime:', err);
    return null;
  }
}
