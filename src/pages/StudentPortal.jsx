import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QueueStatusBadge } from '../components/QueueStatusBadge';
import { MediaModal } from '../components/MediaModal';
import { GithubIcon } from '../components/Icons';
import {
  Presentation,
  Globe,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const StudentPortal = () => {
  const {
    currentUser,
    switchRole,
    users,
    teams,
    panels,
    evaluations,
    activeReviewId,
    reviewRounds,
    rubrics,
    updateTeamDeliverables,
    activeNotification
  } = useApp();

  // Find this student's team
  const studentTeam = teams.find(t => t.id === currentUser.teamId) || teams[0];
  const partnerUser = users.find(
    u => u.role === 'student' && u.teamId === studentTeam.id && u.id !== currentUser.id
  );

  const panel = panels.find(p => p.id === studentTeam.panelId) || panels[0];
  const queueItem = panel.teamQueue.find(q => q.teamId === studentTeam.id);
  const activeRound = reviewRounds.find(r => r.id === activeReviewId) || reviewRounds[2];

  // Evaluations for this team in this round
  const teamEvals = evaluations.filter(
    e => e.teamId === studentTeam.id && e.reviewRoundId === activeReviewId
  );
  const isFullyEvaluated = teamEvals.length >= 3;

  // Local state for editable URLs
  const [githubUrl, setGithubUrl] = useState(studentTeam.githubUrl || '');
  const [pptUrl, setPptUrl] = useState(studentTeam.pptUrl || '');
  const [demoUrl, setDemoUrl] = useState(studentTeam.demoUrl || '');
  const [abstract, setAbstract] = useState(studentTeam.abstract || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal preview state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', url: '', type: 'link' });

  const handleSaveDeliverables = e => {
    e.preventDefault();
    updateTeamDeliverables(studentTeam.id, {
      githubUrl,
      pptUrl,
      demoUrl,
      abstract
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isStandbyAlertForMe = panel.standbyTeamId === studentTeam.id;

  return (
    <div>
      {/* Standby Alert Banner */}
      {isStandbyAlertForMe && (
        <div className="alert-banner warning" style={{ borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 25px rgba(245, 158, 11, 0.25)' }}>
          <AlertTriangle size={28} className="text-amber-800" />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              ⚠️ IMMEDIATE JURY ACTION: STANDBY ALERT ACTIVE!
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem' }}>
              The team currently presenting is concluding. Please proceed immediately to{' '}
              <strong>{panel.venue}</strong> and assemble outside the door with your presentation materials.
            </p>
          </div>
        </div>
      )}

      {/* Student Profile Header & Twin Switcher */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderLeft: '5px solid #3730A3'
        }}
      >
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', background: 'var(--color-highlight-soft)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {studentTeam.code}
              </span>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-text-main)' }}>
                {studentTeam.title}
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Faculty Mentor: <strong>{studentTeam.mentorName}</strong> | Department of Information Technology
            </p>
          </div>

          {/* Twin Account Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Teammate View:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {currentUser.name} ({currentUser.rollNo})
              </div>
            </div>

            {partnerUser && (
              <button
                onClick={() => switchRole('student', partnerUser.id)}
                className="btn btn-outline btn-sm"
                title="Switch to other teammate's login to verify synchronized view"
              >
                <ArrowRightLeft size={14} /> Switch to {partnerUser.name.split(' ')[0]}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Live Queue Tracker & Assigned Panel Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Review Status Card */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Live Review Queue & Venue</h3>
              </div>
              <QueueStatusBadge status={queueItem?.status} />
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <MapPin size={20} color="#7C3AED" style={{ marginTop: '0.2rem' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Review Venue (Updated by Jury)
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.1rem' }}>
                      {panel.venue}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Clock size={20} color="#3730A3" style={{ marginTop: '0.2rem' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Scheduled Presentation Slot
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.1rem' }}>
                      {queueItem ? `${queueItem.slotStart} – ${queueItem.slotEnd}` : 'Slot Scheduled on Review Day'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Users size={20} color="#166534" style={{ marginTop: '0.2rem' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Assigned 3-Member Jury Panel ({panel.code})
                    </span>
                    <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-body)' }}>
                      {panel.juries.map(j => (
                        <li key={j.id} style={{ marginBottom: '0.2rem' }}>
                          <strong>Jury {j.position}:</strong> {j.name} ({j.designation})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Real-time Turn Progress Box */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: queueItem?.status === 'COMPLETED' ? 'var(--status-completed-bg)' : 'var(--color-bg-subtle)',
                  border: `1px solid ${queueItem?.status === 'COMPLETED' ? 'var(--status-completed-border)' : 'var(--color-border)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Queue Status:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    {queueItem?.status === 'COMPLETED'
                      ? '✅ Review Completed & Marks Locked'
                      : queueItem?.status === 'IN_VIVA'
                      ? '🎙️ Inside Review Lab Right Now'
                      : queueItem?.status === 'STANDBY'
                      ? '⚠️ Standby Alert: Proceed to Lab'
                      : '⏳ In Queue: Scheduled Next'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Progress Gauge */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Project Implementation Velocity</h3>
              <span className="score-badge">{studentTeam.progressPercentage}%</span>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: `${studentTeam.progressPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3730A3, #7C3AED)',
                    borderRadius: '9999px'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Verified by faculty mentor and assessed by the 3 juries during Review 2 viva voce.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Deliverables Triad Submission Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Submission of Project Deliverables</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Twin Synchronized: Changes made here update immediately for both teammates and juries
                </p>
              </div>
              <Sparkles size={18} color="#7C3AED" />
            </div>

            <div className="card-body">
              <form onSubmit={handleSaveDeliverables}>
                {/* GitHub Repository URL */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GithubIcon size={16} /> GitHub Repository URL
                    </span>
                    {githubUrl && (
                      <button
                        type="button"
                        onClick={() => setModalConfig({ isOpen: true, title: 'GitHub Repository', url: githubUrl, type: 'github' })}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Test Link
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/organization/project-name"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    required
                  />
                </div>

                {/* Presentation PPT URL */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Presentation size={16} /> Presentation / PPT URL (Google Slides / Canva / PDF)
                    </span>
                    {pptUrl && (
                      <button
                        type="button"
                        onClick={() => setModalConfig({ isOpen: true, title: 'Presentation PPT', url: pptUrl, type: 'ppt' })}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Test Link
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://docs.google.com/presentation/d/..."
                    value={pptUrl}
                    onChange={e => setPptUrl(e.target.value)}
                    required
                  />
                </div>

                {/* Deployed Live URL */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe size={16} /> Deployed / Live Application URL (Prototype)
                    </span>
                    {demoUrl && (
                      <button
                        type="button"
                        onClick={() => setModalConfig({ isOpen: true, title: 'Live Deployed Demo', url: demoUrl, type: 'demo' })}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Test Link
                      </button>
                    )}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://your-project.vercel.app"
                    value={demoUrl}
                    onChange={e => setDemoUrl(e.target.value)}
                    required
                  />
                </div>

                {/* Project Abstract */}
                <div className="form-group">
                  <label className="form-label">Project Abstract & Objectives</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={abstract}
                    onChange={e => setAbstract(e.target.value)}
                    placeholder="Describe your technical architecture and objectives..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  {saveSuccess && (
                    <span style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={16} /> Deliverables Synchronized!
                    </span>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                    Save & Sync with Partner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Results Card (If Completed) */}
      {teamEvals.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header" style={{ background: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                {activeRound.name} — Evaluation Scorecard
              </h3>
            </div>
            {isFullyEvaluated && (
              <span className="status-badge completed">
                All 3 Juries Completed
              </span>
            )}
          </div>

          <div className="card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Evaluator</th>
                    <th>Jury Member</th>
                    <th>Designation</th>
                    <th>Total Score (/50)</th>
                    <th>Viva Feedback & Remarks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {panel.juries.map(jury => {
                    const evalRecord = teamEvals.find(e => e.juryId === jury.id);
                    return (
                      <tr key={jury.id}>
                        <td>
                          <strong>Jury {jury.position}</strong>
                        </td>
                        <td>{jury.name}</td>
                        <td>{jury.designation}</td>
                        <td>
                          {evalRecord ? (
                            <span className="score-badge">{evalRecord.totalScore.toFixed(1)} / 50</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>Pending Evaluation</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          {evalRecord?.remarks || 'Awaiting completion of viva session.'}
                        </td>
                        <td>
                          {evalRecord?.isLocked ? (
                            <span className="status-badge completed">Locked</span>
                          ) : (
                            <span className="status-badge waiting">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isFullyEvaluated && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-highlight-soft)',
                  border: '1px solid #C7D2FE',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                    Consolidated 3-Jury Average Score
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-body)' }}>
                    Calculated average across all 3 independent jury sheets for {activeRound.code}
                  </p>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                  {(teamEvals.reduce((a, b) => a + Number(b.totalScore), 0) / 3).toFixed(2)} / 50.00
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Launcher Modal */}
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
