import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  INITIAL_INSTITUTION,
  INITIAL_REVIEW_ROUNDS,
  INITIAL_RUBRICS,
  INITIAL_USERS,
  INITIAL_TEAMS,
  INITIAL_PANELS,
  INITIAL_EVALUATIONS,
  OFFICIAL_KEC_FACULTY
} from '../data/initialData';

const AppContext = createContext();
const DATA_VERSION = 'v7_multi_panels_expanded';

export const AppProvider = ({ children }) => {
  // Check version to ensure new HOD and faculty updates apply immediately
  useEffect(() => {
    const savedVer = localStorage.getItem('pe_version');
    if (savedVer !== DATA_VERSION) {
      localStorage.setItem('pe_version', DATA_VERSION);
      localStorage.setItem('pe_institution', JSON.stringify(INITIAL_INSTITUTION));
      localStorage.setItem('pe_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('pe_panels', JSON.stringify(INITIAL_PANELS));
      localStorage.setItem('pe_teams', JSON.stringify(INITIAL_TEAMS));
      localStorage.setItem('pe_evaluations', JSON.stringify(INITIAL_EVALUATIONS));
      setInstitution(INITIAL_INSTITUTION);
      setUsers(INITIAL_USERS);
      setPanels(INITIAL_PANELS);
      setTeams(INITIAL_TEAMS);
      setEvaluations(INITIAL_EVALUATIONS);
    }
  }, []);

  // Load state from localStorage or initial seed
  const [institution, setInstitution] = useState(() => {
    const saved = localStorage.getItem('pe_institution');
    const savedVer = localStorage.getItem('pe_version');
    return saved && savedVer === DATA_VERSION ? JSON.parse(saved) : INITIAL_INSTITUTION;
  });

  const [reviewRounds, setReviewRounds] = useState(() => {
    const saved = localStorage.getItem('pe_rounds');
    return saved ? JSON.parse(saved) : INITIAL_REVIEW_ROUNDS;
  });

  const [activeReviewId, setActiveReviewId] = useState('REV-2');

  const [rubrics, setRubrics] = useState(() => {
    const saved = localStorage.getItem('pe_rubrics');
    return saved ? JSON.parse(saved) : INITIAL_RUBRICS;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('pe_users');
    const savedVer = localStorage.getItem('pe_version');
    return saved && savedVer === DATA_VERSION ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('pe_teams');
    const savedVer = localStorage.getItem('pe_version');
    return saved && savedVer === DATA_VERSION ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  const [panels, setPanels] = useState(() => {
    const saved = localStorage.getItem('pe_panels');
    const savedVer = localStorage.getItem('pe_version');
    return saved && savedVer === DATA_VERSION ? JSON.parse(saved) : INITIAL_PANELS;
  });

  const [evaluations, setEvaluations] = useState(() => {
    const saved = localStorage.getItem('pe_evaluations');
    const savedVer = localStorage.getItem('pe_version');
    return saved && savedVer === DATA_VERSION ? JSON.parse(saved) : INITIAL_EVALUATIONS;
  });

  // Current session state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('pe_authenticated');
    return savedAuth !== null ? JSON.parse(savedAuth) : false; // Start on Login page or easily toggleable
  });
  const [currentRole, setCurrentRole] = useState('super_admin'); // default for holistic view
  const [currentUserId, setCurrentUserId] = useState('usr-superadmin');
  const [activeNotification, setActiveNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('pe_authenticated', JSON.stringify(true));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('pe_authenticated', JSON.stringify(false));
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pe_institution', JSON.stringify(institution));
  }, [institution]);

  useEffect(() => {
    localStorage.setItem('pe_rounds', JSON.stringify(reviewRounds));
  }, [reviewRounds]);

  useEffect(() => {
    localStorage.setItem('pe_rubrics', JSON.stringify(rubrics));
  }, [rubrics]);

  useEffect(() => {
    localStorage.setItem('pe_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('pe_panels', JSON.stringify(panels));
  }, [panels]);

  useEffect(() => {
    localStorage.setItem('pe_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  // Sound chime for Standby Alerts
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('AudioContext not permitted yet', e);
    }
  };

  // Switch role and set corresponding sample user
  const switchRole = (role, customUserId = null) => {
    setCurrentRole(role);
    if (customUserId) {
      setCurrentUserId(customUserId);
      return;
    }
    // Default user per role
    switch (role) {
      case 'student':
        setCurrentUserId('usr-stu-1'); // Yogeshwaran V (22ITR112)
        break;
      case 'jury':
        setCurrentUserId('usr-jury-1'); // Dr. J. Premalatha (Jury 1)
        break;
      case 'admin':
        setCurrentUserId('usr-admin'); // Mr. Senthilkumar (Lab Assistant)
        break;
      case 'super_admin':
      default:
        setCurrentUserId('usr-superadmin'); // Dr. S. Varadhaganapathy (HOD)
        break;
    }
  };

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // ----------------------------------------------------
  // ADMIN ONLY: Dynamic Rubric Management
  // ----------------------------------------------------
  const updateRubricCriterion = (roundId, criterionId, updatedFields) => {
    if (currentRole !== 'admin') {
      alert('Security Alert: Only the Project Coordinator (Admin) has permission to edit rubrics.');
      return;
    }
    setRubrics(prev => {
      const roundList = prev[roundId] || [];
      const updatedList = roundList.map(item =>
        item.id === criterionId ? { ...item, ...updatedFields } : item
      );
      return { ...prev, [roundId]: updatedList };
    });
  };

  const addRubricCriterion = (roundId, newCriterion) => {
    if (currentRole !== 'admin') {
      alert('Security Alert: Only the Admin can add rubric criteria.');
      return;
    }
    setRubrics(prev => {
      const roundList = prev[roundId] || [];
      return { ...prev, [roundId]: [...roundList, newCriterion] };
    });
  };

  const deleteRubricCriterion = (roundId, criterionId) => {
    if (currentRole !== 'admin') {
      alert('Security Alert: Only the Admin can remove rubric criteria.');
      return;
    }
    setRubrics(prev => {
      const roundList = prev[roundId] || [];
      return { ...prev, [roundId]: roundList.filter(item => item.id !== criterionId) };
    });
  };

  // ----------------------------------------------------
  // JURY & QUEUE ORCHESTRATION
  // ----------------------------------------------------
  const sendStandbyAlert = (panelId, targetTeamId, customMsg = null) => {
    const targetTeam = teams.find(t => t.id === targetTeamId);
    const msg = customMsg || `Standby Alert: Current viva is concluding. Team ${targetTeam?.code || ''} (${targetTeam?.title || ''}), please proceed to venue and assemble outside!`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPanels(prev =>
      prev.map(panel => {
        if (panel.id !== panelId) return panel;
        const updatedQueue = panel.teamQueue.map(item =>
          item.teamId === targetTeamId ? { ...item, status: 'STANDBY' } : item
        );
        return {
          ...panel,
          standbyTeamId: targetTeamId,
          lastStandbyAlert: msg,
          alertTimestamp: timeStr,
          teamQueue: updatedQueue
        };
      })
    );

    setActiveNotification({
      type: 'standby',
      title: '🚨 Standby Alert Triggered',
      message: msg,
      targetTeamId: targetTeamId,
      timestamp: timeStr
    });

    playAlertSound();
  };

  const markTeamFinishedAndAdvance = (panelId) => {
    setPanels(prev =>
      prev.map(panel => {
        if (panel.id !== panelId) return panel;
        const currentActiveId = panel.activeTeamId;
        const queue = [...panel.teamQueue];
        const activeIdx = queue.findIndex(q => q.teamId === currentActiveId);

        if (activeIdx !== -1) {
          queue[activeIdx] = { ...queue[activeIdx], status: 'COMPLETED' };
        }

        const nextItem = queue.find((q, idx) => idx > activeIdx && q.status !== 'COMPLETED');
        const nextActiveId = nextItem ? nextItem.teamId : null;

        if (nextActiveId) {
          const nextIdx = queue.findIndex(q => q.teamId === nextActiveId);
          queue[nextIdx] = { ...queue[nextIdx], status: 'IN_VIVA' };
        }

        return {
          ...panel,
          activeTeamId: nextActiveId,
          standbyTeamId: null,
          teamQueue: queue
        };
      })
    );

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const updatePanelVenue = (panelId, newVenue) => {
    setPanels(prev =>
      prev.map(p => (p.id === panelId ? { ...p, venue: newVenue } : p))
    );
  };

  // ----------------------------------------------------
  // JURY EVALUATION & RUBRIC SCORING
  // ----------------------------------------------------
  const saveJuryEvaluation = ({
    panelId,
    teamId,
    reviewRoundId,
    juryId,
    marks,
    remarks,
    progressPercentage,
    isLocked = false
  }) => {
    const totalScore = Object.values(marks).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

    setEvaluations(prev => {
      const existingIdx = prev.findIndex(
        e => e.panelId === panelId && e.teamId === teamId && e.reviewRoundId === reviewRoundId && e.juryId === juryId
      );

      const newEval = {
        id: existingIdx !== -1 ? prev[existingIdx].id : `eval-${Date.now()}`,
        panelId,
        teamId,
        reviewRoundId,
        juryId,
        marks,
        totalScore,
        remarks,
        isLocked,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = newEval;
        return copy;
      }
      return [...prev, newEval];
    });

    if (progressPercentage !== undefined) {
      setTeams(prev =>
        prev.map(t => (t.id === teamId ? { ...t, progressPercentage } : t))
      );
    }

    if (isLocked) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // ----------------------------------------------------
  // STUDENT TEAM PROFILE & DELIVERABLES SYNC
  // ----------------------------------------------------
  const updateTeamDeliverables = (teamId, updatedFields) => {
    setTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, ...updatedFields } : t))
    );
  };

  // ----------------------------------------------------
  // ADMIN ONLY: Panel Jury & Team Assignment Management
  // ----------------------------------------------------
  const updatePanelJuries = (panelId, newJuriesArray) => {
    if (currentRole !== 'admin') {
      alert('Security Alert: Only the Admin can modify panel jury assignments.');
      return;
    }
    setPanels(prev =>
      prev.map(p =>
        p.id === panelId ? { ...p, juries: newJuriesArray } : p
      )
    );
  };

  const updatePanelTeamQueue = (panelId, newTeamQueueArray) => {
    if (currentRole !== 'admin') {
      alert('Security Alert: Only the Admin can modify panel team assignments.');
      return;
    }
    // Also update each team's panelId to match
    const newTeamIds = newTeamQueueArray.map(q => q.teamId);
    setTeams(prev =>
      prev.map(t => {
        if (newTeamIds.includes(t.id)) return { ...t, panelId };
        // If team was previously in this panel but removed, keep panelId as-is (don't orphan)
        return t;
      })
    );
    setPanels(prev =>
      prev.map(p =>
        p.id === panelId ? { ...p, teamQueue: newTeamQueueArray } : p
      )
    );
  };

  // ----------------------------------------------------
  // SUPER ADMIN EXPORT — CSV (opens in Excel & Google Sheets)
  // ----------------------------------------------------
  const exportConsolidatedExcel = (selectedReviewId = null) => {
    const reviewId = selectedReviewId || activeReviewId;
    const round = reviewRounds.find(r => r.id === reviewId) || reviewRounds.find(r => r.isActive) || reviewRounds[2];

    try {
      const columnHeaders = [
        'S.No', 'Team No.', 'Panel No.', 'Panel Venue', 'Project Title',
        'Student 1 Name', 'Student 1 Roll No.', 'Student 2 Name', 'Student 2 Roll No.',
        'Faculty Mentor',
        'Jury 1 Name', 'Jury 1 Mark (/50)',
        'Jury 2 Name', 'Jury 2 Mark (/50)',
        'Jury 3 Name', 'Jury 3 Mark (/50)',
        'Evaluated Average (/50)',
        'Queue Status', 'Time Slot', 'Progress %',
        'GitHub Repo', 'PPT Link', 'Demo URL'
      ];

      // Helper: ALWAYS wrap in double-quotes (RFC 4180 strict mode)
      // This ensures every cell stays within its column in Google Sheets & Excel
      const esc = (val) => {
        const s = String(val === null || val === undefined ? '' : val);
        return '"' + s.replace(/"/g, '""') + '"';
      };

      const dataRows = teams.map((team, index) => {
        const panel = panels.find(p => p.id === team.panelId) || panels[0];
        const panelTeam = panel?.teamQueue?.find(q => q.teamId === team.id);
        const teamEvals = evaluations.filter(
          e => e.teamId === team.id && e.reviewRoundId === reviewId
        );

        const j1 = panel?.juries?.[0];
        const j2 = panel?.juries?.[1];
        const j3 = panel?.juries?.[2];

        const j1Eval = teamEvals.find(e => e.juryId === j1?.id);
        const j2Eval = teamEvals.find(e => e.juryId === j2?.id);
        const j3Eval = teamEvals.find(e => e.juryId === j3?.id);

        const j1Score = j1Eval ? Number(j1Eval.totalScore) : null;
        const j2Score = j2Eval ? Number(j2Eval.totalScore) : null;
        const j3Score = j3Eval ? Number(j3Eval.totalScore) : null;

        const validScores = [j1Score, j2Score, j3Score].filter(s => s !== null && s !== undefined);
        const avgScore = validScores.length > 0
          ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
          : 'Pending';

        return [
          index + 1,
          team.code,
          panel ? panel.code : 'Unassigned',
          panel ? panel.venue.split('-')[0].trim() : '-',
          team.title,
          team.members[0]?.name || '-',
          team.members[0]?.rollNo || '-',
          team.members[1]?.name || '-',
          team.members[1]?.rollNo || '-',
          team.mentorName || '-',
          j1?.name || '-',
          j1Score !== null ? j1Score : 'Pending',
          j2?.name || '-',
          j2Score !== null ? j2Score : 'Pending',
          j3?.name || '-',
          j3Score !== null ? j3Score : 'Pending',
          avgScore,
          panelTeam ? panelTeam.status : 'WAITING',
          panelTeam ? `${panelTeam.slotStart} - ${panelTeam.slotEnd}` : '-',
          `${team.progressPercentage}%`,
          team.githubUrl || '-',
          team.pptUrl || '-',
          team.demoUrl || '-'
        ];
      });

      if (dataRows.length === 0) {
        alert('No team data available to export.');
        return;
      }

      const exportDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // Build CSV lines
      const lines = [
        `Kongu Engineering College (Autonomous) - Department of Information Technology`,
        `Project Evaluation Mark Sheet - ${round.name}`,
        `Exported: ${exportDate} | Total Teams: ${dataRows.length} | Total Panels: ${panels.length}`,
        '', // blank separator
        columnHeaders.map(esc).join(','),
        ...dataRows.map(row => row.map(esc).join(','))
      ];

      const csvContent = '\uFEFF' + lines.join('\r\n'); // BOM for UTF-8 Excel compatibility
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KEC_IT_ProjectEval_${round.code}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}. Please try again.`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        institution,
        reviewRounds,
        activeReviewId,
        setActiveReviewId,
        rubrics,
        users,
        facultyDirectory: OFFICIAL_KEC_FACULTY,
        teams,
        panels,
        evaluations,
        currentRole,
        currentUserId,
        currentUser,
        isAuthenticated,
        login,
        logout,
        activeNotification,
        setActiveNotification,
        soundEnabled,
        setSoundEnabled,
        switchRole,
        updateRubricCriterion,
        addRubricCriterion,
        deleteRubricCriterion,
        sendStandbyAlert,
        markTeamFinishedAndAdvance,
        updatePanelVenue,
        saveJuryEvaluation,
        updateTeamDeliverables,
        updatePanelJuries,
        updatePanelTeamQueue,
        exportConsolidatedExcel
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
