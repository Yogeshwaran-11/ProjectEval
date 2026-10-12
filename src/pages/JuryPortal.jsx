import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QueueStatusBadge } from '../components/QueueStatusBadge';
import { MediaModal } from '../components/MediaModal';
import { GithubIcon } from '../components/Icons';
import {
  Users,
  Clock,
  MapPin,
  BellRing,
  CheckCircle,
  ExternalLink,
  Presentation,
  Globe,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  Sliders,
  FileCheck
} from 'lucide-react';

export const JuryPortal = () => {
  const {
    currentUser,
    switchRole,
    users,
    panels,
    teams,
    rubrics,
    activeReviewId,
    reviewRounds,
    evaluations,
    sendStandbyAlert,
    markTeamFinishedAndAdvance,
    updatePanelVenue,
    saveJuryEvaluation
  } = useApp();

  // STRICT AUTHORIZATION: A jury member can ONLY view their assigned panel and teams.
  // Juries are strictly prevented from jumping to or viewing other panels.
  const userAssignedPanel = panels.find(p => p.juries.some(j => j.id === currentUser.id)) || panels[0];
  const panel = userAssignedPanel;
  const activeRound = reviewRounds.find(r => r.id === activeReviewId) || reviewRounds[2];
  const roundRubrics = rubrics[activeReviewId] || [];

  // Currently selected team in the jury queue sidebar (strictly from this panel's teamQueue)
  const [selectedTeamId, setSelectedTeamId] = useState(panel.activeTeamId || panel.teamQueue[0]?.teamId || teams[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVenue, setEditingVenue] = useState(panel.venue);
  const [venueSaved, setVenueSaved] = useState(false);

  // Sync selectedTeamId when currentUser or panel changes
  useEffect(() => {
    setSelectedTeamId(panel.activeTeamId || panel.teamQueue[0]?.teamId);
    setEditingVenue(panel.venue);
  }, [panel.id, currentUser.id]);

  // Modal configuration
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', url: '', type: 'link' });

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const queueItem = panel.teamQueue.find(q => q.teamId === selectedTeamId);

  // Load existing evaluation for this jury member + team + round
  const existingEval = evaluations.find(
    e => e.panelId === panel.id && e.teamId === selectedTeam.id && e.reviewRoundId === activeReviewId && e.juryId === currentUser.id
  );

  // Form state for marks
  const [marksState, setMarksState] = useState({});
  const [remarks, setRemarks] = useState('');
  const [progressPct, setProgressPct] = useState(selectedTeam.progressPercentage || 75);
  const [isLocked, setIsLocked] = useState(false);

  // Sync marks when switching teams
  useEffect(() => {
    if (existingEval) {
      setMarksState(existingEval.marks || {});
      setRemarks(existingEval.remarks || '');
      setIsLocked(Boolean(existingEval.isLocked));
    } else {
      // Default initial marks (e.g. 8.5 for each criterion)
      const defaultMarks = {};
      roundRubrics.forEach(crit => {
        defaultMarks[crit.id] = 8.5;
      });
      setMarksState(defaultMarks);
      setRemarks('');
      setIsLocked(false);
    }
    setProgressPct(selectedTeam.progressPercentage || 75);
  }, [selectedTeamId, existingEval, activeReviewId]);

  // Compute live total score
  const totalScore = roundRubrics.reduce((acc, curr) => {
    return acc + (Number(marksState[curr.id]) || 0);
  }, 0);

  const handleScoreChange = (criterionId, val) => {
    if (isLocked) return;
    const num = Math.min(10, Math.max(0, parseFloat(val) || 0));
    setMarksState(prev => ({ ...prev, [criterionId]: num }));
  };

  const handleSaveEvaluation = lockSubmission => {
    saveJuryEvaluation({
      panelId: panel.id,
      teamId: selectedTeam.id,
      reviewRoundId: activeReviewId,
      juryId: currentUser.id,
      marks: marksState,
      remarks,
      progressPercentage: progressPct,
      isLocked: lockSubmission
    });
    if (lockSubmission) {
      setIsLocked(true);
    }
  };

  // Find next upcoming team in queue for standby alert
  const currentQueueIdx = panel.teamQueue.findIndex(q => q.teamId === panel.activeTeamId);
  const nextTeamItem = panel.teamQueue.find((q, idx) => idx > currentQueueIdx && q.status !== 'COMPLETED');
  const nextTeam = nextTeamItem ? teams.find(t => t.id === nextTeamItem.teamId) : null;

  const handleBroadcastVenue = e => {
    e.preventDefault();
    updatePanelVenue(panel.id, editingVenue);
    setVenueSaved(true);
    setTimeout(() => setVenueSaved(false), 2500);
  };

  // Filter queue
  const filteredQueue = panel.teamQueue.filter(item => {
    const team = teams.find(t => t.id === item.teamId);
    if (!team) return false;
    return (
      team.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.some(m => m.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const completedCount = panel.teamQueue.filter(q => q.status === 'COMPLETED').length;
  const totalInQueue = panel.teamQueue.length;

  return (
    <div>
      {/* Top Panel Coordination Strip */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderLeft: '5px solid #7C3AED'
        }}
      >
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', background: '#3730A3', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {panel.code}
              </span>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text-main)' }}>
                Faculty Evaluation Panel — {activeRound.name}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Logged in as: <strong>{currentUser.name}</strong> ({currentUser.designation}) · <strong>Jury {currentUser.juryPosition} of 3</strong>
            </p>
          </div>

          {/* Panel Selector & Quick Jury Switcher */}
          {/* Panel Restriction Badge & Panel Jury Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#EEF2FF',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #C7D2FE',
                fontSize: '0.775rem'
              }}
              title="Panel Restricted Access: You are assigned strictly to this panel"
            >
              <Lock size={14} color="#3730A3" />
              <span style={{ fontWeight: 800, color: '#3730A3' }}>Assigned: {panel.code}</span>
              <span style={{ color: '#4B5563', fontWeight: 600 }}>({panel.venue.split('-')[0].trim()})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Panel Juries:</span>
              {panel.juries.map(j => (
                <button
                  key={j.id}
                  onClick={() => switchRole('jury', j.id)}
                  className={`btn btn-sm ${currentUser.id === j.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                  title={`${j.name} (${j.designation})`}
                >
                  Jury {j.position}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Sidebar Queue + Evaluation Sheet */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
        {/* Left Column: Multi-Team Panel Queue Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Queue Header & Progress Metric */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Panel Team Roster ({panel.code})</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Restricted: Strictly {panel.teamQueue.length} teams allocated to {panel.code}
                </span>
              </div>
              <span className="score-badge" style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
                {completedCount}/{totalInQueue}
              </span>
            </div>

            <div className="card-body" style={{ padding: '0.75rem' }}>
              {/* Search filter */}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search code, title, roll no..."
                  className="form-input"
                  style={{ paddingLeft: '2rem', fontSize: '0.8rem', padding: '0.45rem 0.5rem 0.45rem 2rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sequential Queue List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
                {filteredQueue.map(item => {
                  const team = teams.find(t => t.id === item.teamId);
                  const isSelected = selectedTeam.id === item.teamId;
                  const isPanelActive = panel.activeTeamId === item.teamId;

                  return (
                    <div
                      key={item.teamId}
                      onClick={() => setSelectedTeamId(item.teamId)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-highlight-soft)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {team.code}
                        </span>
                        <QueueStatusBadge status={item.status} />
                      </div>

                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.25, marginBottom: '0.25rem' }}>
                        {team.title}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {item.slotStart}
                        </span>
                        <span>{team.members.map(m => m.rollNo).join(', ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Venue Broadcast Box */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--color-primary)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Review Venue Broadcast</h4>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleBroadcastVenue}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}
                  value={editingVenue}
                  onChange={e => setEditingVenue(e.target.value)}
                  placeholder="e.g. IT Lab 4 - Ground Floor"
                  required
                />
                <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  {venueSaved ? '✓ Venue Broadcasted!' : 'Update & Broadcast Venue'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Active Team Viva Evaluation Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Team Header & Deliverables Launcher */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-highlight-soft)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {selectedTeam.code}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Slot: {queueItem?.slotStart} – {queueItem?.slotEnd}
                    </span>
                    <QueueStatusBadge status={queueItem?.status} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.35rem 0', color: 'var(--color-text-main)' }}>
                    {selectedTeam.title}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Faculty Mentor: <strong>{selectedTeam.mentorName}</strong> | Students:{' '}
                    {selectedTeam.members.map(m => `${m.name} (${m.rollNo})`).join(' & ')}
                  </div>
                </div>

                {/* Queue Control Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Standby Alert button */}
                  {nextTeam && (
                    <button
                      onClick={() => sendStandbyAlert(panel.id, nextTeam.id)}
                      className="btn btn-warning btn-sm"
                      title="Notify next team in queue to assemble outside room"
                    >
                      <BellRing size={15} /> Alert Next Team ({nextTeam.code})
                    </button>
                  )}

                  {/* Mark Finished & Advance */}
                  <button
                    onClick={() => markTeamFinishedAndAdvance(panel.id)}
                    className="btn btn-success btn-sm"
                    title="Mark presentation completed and advance to next team"
                  >
                    <CheckCircle size={15} /> Mark Finished & Advance <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* The Proof Triad Launcher Bar */}
              <div
                style={{
                  background: 'var(--color-bg-subtle)',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Verified Deliverables Triad:
                </span>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {/* GitHub Repo */}
                  <button
                    onClick={() => setModalConfig({ isOpen: true, title: 'GitHub Codebase', url: selectedTeam.githubUrl, type: 'github' })}
                    className="deliverable-link"
                  >
                    <GithubIcon size={15} color="#3730A3" /> GitHub Repo <ExternalLink size={12} />
                  </button>

                  {/* Presentation PPT */}
                  <button
                    onClick={() => setModalConfig({ isOpen: true, title: 'Presentation Slides (PPT)', url: selectedTeam.pptUrl, type: 'ppt' })}
                    className="deliverable-link"
                  >
                    <Presentation size={15} color="#7C3AED" /> View PPT Slides <ExternalLink size={12} />
                  </button>

                  {/* Deployed App */}
                  <button
                    onClick={() => setModalConfig({ isOpen: true, title: 'Live Deployed Prototype', url: selectedTeam.demoUrl, type: 'demo' })}
                    className="deliverable-link"
                    style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}
                  >
                    <Globe size={15} color="#166534" /> Launch Live App <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 50-Mark Rubrics Evaluation Sheet (5 Criteria x 10 Marks) */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                  Standardized 50-Mark Rubric Sheet ({activeRound.name})
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  5 Distinct Criteria × 10 Marks Each · Evaluated independently by Jury {currentUser.juryPosition}
                </p>
              </div>

              {/* Total Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  Your Score:
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'var(--color-primary)',
                    background: 'var(--color-highlight-soft)',
                    padding: '0.2rem 0.8rem',
                    borderRadius: '8px'
                  }}
                >
                  {totalScore.toFixed(1)} / 50.0
                </div>
              </div>
            </div>

            <div className="card-body">
              {/* Progress % Slider */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Verified Project Completion Velocity (%)
                  </label>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{progressPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPct}
                  disabled={isLocked}
                  onChange={e => setProgressPct(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#7C3AED', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                />
              </div>

              {/* 5 Criteria Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {roundRubrics.map((crit, index) => {
                  const currentMark = marksState[crit.id] !== undefined ? marksState[crit.id] : 8.5;

                  return (
                    (() => {
                      const pct = Math.round((currentMark / crit.maxMarks) * 100);
                      const barColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                      const barBg = pct >= 70 ? '#dcfce7' : pct >= 40 ? '#fef3c7' : '#fee2e2';
                      return (
                        <div
                          key={crit.id}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            background: '#FFFFFF',
                            border: `1px solid ${pct >= 70 ? '#86efac' : pct >= 40 ? '#fcd34d' : '#fca5a5'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            transition: 'border-color 0.3s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                  {crit.code}
                                </span>
                                <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--color-text-main)' }}>
                                  {crit.title}
                                </h4>
                              </div>
                              <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                {crit.desc}
                              </p>
                            </div>
                            {/* Marks Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input
                                type="range"
                                min="0"
                                max={crit.maxMarks}
                                step="0.5"
                                value={currentMark}
                                disabled={isLocked}
                                onChange={e => handleScoreChange(crit.id, e.target.value)}
                                style={{ width: '130px', accentColor: barColor, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={crit.maxMarks}
                                  step="0.5"
                                  value={currentMark}
                                  disabled={isLocked}
                                  onChange={e => handleScoreChange(crit.id, e.target.value)}
                                  className="form-input"
                                  style={{
                                    width: '65px',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    fontFamily: 'var(--font-display)',
                                    color: barColor,
                                    borderColor: barColor,
                                    transition: 'color 0.3s, border-color 0.3s'
                                  }}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                  / {crit.maxMarks}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ── Live animated fill bar ── */}
                          <div style={{ background: barBg, borderRadius: '999px', height: '7px', overflow: 'hidden', transition: 'background 0.3s' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: barColor,
                                borderRadius: '999px',
                                transition: 'width 0.25s ease, background 0.3s ease',
                                position: 'relative'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '-0.5rem' }}>
                            <span>0</span>
                            <span style={{ fontWeight: 700, color: barColor }}>{pct}% of criteria marks</span>
                            <span>{crit.maxMarks}</span>
                          </div>
                        </div>
                      );
                    })()
                  );
                })}
              </div>

              {/* Remarks Field */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Viva Feedback & Technical Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={remarks}
                  disabled={isLocked}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter specific feedback on architecture, Git commits, live demo features, or Q&A defense..."
                />
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                {isLocked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Lock size={18} /> Marks Locked & Finalized for Jury {currentUser.juryPosition}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSaveEvaluation(false)}
                    className="btn btn-outline"
                  >
                    Save Draft Marks
                  </button>
                )}

                {!isLocked && (
                  <button
                    onClick={() => handleSaveEvaluation(true)}
                    className="btn btn-primary"
                    style={{ gap: '0.6rem' }}
                  >
                    <Lock size={16} /> Submit & Lock Evaluation (Total: {totalScore.toFixed(1)}/50)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Viewer Modal */}
      <MediaModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        url={modalConfig.url}
        type={modalConfig.type}
      />
    </div>
  );
};
