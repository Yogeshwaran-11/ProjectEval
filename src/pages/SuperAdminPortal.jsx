import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MediaModal } from '../components/MediaModal';
import { QueueStatusBadge } from '../components/QueueStatusBadge';
import { GithubIcon } from '../components/Icons';
import { ProgressRing } from '../components/ProgressRing';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  Award,
  MapPin,
  Presentation,
  Globe,
  Mail,
  ChevronDown,
  Download
} from 'lucide-react';

export const SuperAdminPortal = () => {
  const {
    institution,
    reviewRounds,
    activeReviewId,
    teams,
    panels,
    evaluations,
    exportConsolidatedExcel,
    facultyDirectory = []
  } = useApp();

  const [viewTab, setViewTab] = useState('evaluations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPanelFilter, setSelectedPanelFilter] = useState('ALL');
  const [facultySearch, setFacultySearch] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', url: '', type: 'link' });
  // Review selector for export
  const [selectedExportReviewId, setSelectedExportReviewId] = useState(activeReviewId || 'REV-2');

  const activeRound = reviewRounds.find(r => r.id === activeReviewId) || reviewRounds[2];
  const selectedExportRound = reviewRounds.find(r => r.id === selectedExportReviewId) || activeRound;

  // --------------- PDF EXPORT FUNCTION ---------------
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const reviewId = selectedExportReviewId;
      const round = reviewRounds.find(r => r.id === reviewId) || activeRound;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // ---- Header ----
      doc.setFillColor(55, 48, 163); // royal indigo
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('KONGU ENGINEERING COLLEGE (AUTONOMOUS)', pageWidth / 2, 8, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Department of Information Technology — Project Evaluation Mark Sheet', pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Review: ${round.name}  |  Academic Year: ${institution.academicYear}  |  Batch: ${institution.batch}`, pageWidth / 2, 20, { align: 'center' });

      // ---- Meta info below header ----
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Exported: ${new Date().toLocaleString('en-IN')}  |  Total Teams: ${teams.length}  |  Panels: ${panels.length}`, 10, 28);
      doc.text(`HOD: Dr. S. Varadhaganapathy  |  Evaluation Administrator: Mr. Senthilkumar`, pageWidth - 10, 28, { align: 'right' });

      // ---- Table rows ----
      const tableBody = teams.map((team, index) => {
        const panel = panels.find(p => p.id === team.panelId) || panels[0];
        const teamEvals = evaluations.filter(e => e.teamId === team.id && e.reviewRoundId === reviewId);

        const j1 = panel?.juries?.[0];
        const j2 = panel?.juries?.[1];
        const j3 = panel?.juries?.[2];
        const j1Eval = teamEvals.find(e => e.juryId === j1?.id);
        const j2Eval = teamEvals.find(e => e.juryId === j2?.id);
        const j3Eval = teamEvals.find(e => e.juryId === j3?.id);

        const j1Score = j1Eval ? Number(j1Eval.totalScore).toFixed(1) : '-';
        const j2Score = j2Eval ? Number(j2Eval.totalScore).toFixed(1) : '-';
        const j3Score = j3Eval ? Number(j3Eval.totalScore).toFixed(1) : '-';

        const validScores = [j1Eval?.totalScore, j2Eval?.totalScore, j3Eval?.totalScore]
          .filter(s => s !== undefined && s !== null)
          .map(Number);
        const avg = validScores.length > 0
          ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
          : 'Pending';

        const stu1 = team.members[0] ? `${team.members[0].name}\n${team.members[0].rollNo}` : '-';
        const stu2 = team.members[1] ? `${team.members[1].name}\n${team.members[1].rollNo}` : '-';

        return [
          index + 1,
          team.code,
          panel ? panel.code : '-',
          team.title,
          stu1,
          stu2,
          team.mentorName || '-',
          j1Score,
          j2Score,
          j3Score,
          avg
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [[
          '#', 'Team No.', 'Panel', 'Project Title',
          'Student 1\n(Name / Roll)', 'Student 2\n(Name / Roll)',
          'Mentor', 'Jury 1\n(/50)', 'Jury 2\n(/50)', 'Jury 3\n(/50)', 'Avg\n(/50)'
        ]],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [55, 48, 163],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'center', cellWidth: 16 },
          3: { cellWidth: 55 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 32 },
          7: { halign: 'center', cellWidth: 14 },
          8: { halign: 'center', cellWidth: 14 },
          9: { halign: 'center', cellWidth: 14 },
          10: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [240, 242, 255] },
        didDrawPage: (data) => {
          // Footer on each page
          const pgCount = doc.internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${data.pageNumber} of ${pgCount}  —  Kongu Engineering College (Autonomous), IT Dept  —  CONFIDENTIAL`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 5,
            { align: 'center' }
          );
        }
      });

      // Signature section on last page
      const finalY = doc.lastAutoTable?.finalY || 150;
      if (finalY + 30 < doc.internal.pageSize.getHeight()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text('Verified By:', 10, finalY + 15);
        doc.line(10, finalY + 28, 60, finalY + 28);
        doc.text('Evaluation Administrator', 10, finalY + 32);
        doc.text('Mr. Senthilkumar (KEC-IT-LA01)', 10, finalY + 36);

        doc.text('Approved By:', pageWidth - 80, finalY + 15);
        doc.line(pageWidth - 80, finalY + 28, pageWidth - 10, finalY + 28);
        doc.text('Head of Department', pageWidth - 80, finalY + 32);
        doc.text('Dr. S. Varadhaganapathy (KEC-IT-HOD)', pageWidth - 80, finalY + 36);
      }

      doc.save(`KEC_IT_ProjectEval_${round.code}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF generation failed: ' + err.message);
    }
  };

  // Dynamic department-wide KPI metrics
  const totalCompletedCount = panels.reduce(
    (acc, p) => acc + (p.teamQueue ? p.teamQueue.filter(q => q.status === 'COMPLETED').length : 0),
    0
  );

  const completedTeamIds = new Set();
  panels.forEach(p => p.teamQueue?.filter(q => q.status === 'COMPLETED').forEach(q => completedTeamIds.add(q.teamId)));
  const completedScores = [];
  completedTeamIds.forEach(tId => {
    const tEvals = evaluations.filter(e => e.teamId === tId && e.reviewRoundId === activeReviewId);
    if (tEvals.length > 0) {
      const avg = tEvals.reduce((a, b) => a + Number(b.totalScore || 0), 0) / tEvals.length;
      completedScores.push(avg);
    }
  });
  const deptAvg = completedScores.length > 0
    ? (completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(2)
    : '45.80';

  // 🎉 Completion fireworks — fires when ALL teams across ALL panels are done
  useEffect(() => {
    if (totalCompletedCount > 0 && totalCompletedCount >= teams.length) {
      import('canvas-confetti').then(({ default: confetti }) => {
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ['#3730A3', '#7C3AED', '#166534', '#F59E0B', '#EF4444'];
        const frame = () => {
          confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
          confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      });
    }
  }, [totalCompletedCount, teams.length]);


  // Filtered teams
  const filteredTeams = teams.filter(team => {
    const matchesPanel = selectedPanelFilter === 'ALL' || team.panelId === selectedPanelFilter;
    const matchesSearch =
      team.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.some(
        m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesPanel && matchesSearch;
  });

  // Filtered faculty
  const filteredFaculty = facultyDirectory.filter(f => {
    return (
      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.designation.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.email.toLowerCase().includes(facultySearch.toLowerCase())
    );
  });

  const handlePrintPDF = () => {
    window.print();
  };

  const hodFaculty = facultyDirectory.find(f => f.isHOD) || facultyDirectory[0];

  return (
    <div>
      {/* Super Admin Top Header */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderLeft: '5px solid #166534'
        }}
      >
        <div
          className="card-body"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {hodFaculty?.photo && (
              <img
                src={hodFaculty.photo}
                alt={hodFaculty.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid #166534',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                }}
              />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    background: '#166534',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px'
                  }}
                >
                  SUPER ADMIN & HOD CONTROL
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                  {hodFaculty?.name} (Head of Department)
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-text-main)' }}>
                Department of Information Technology — Review Central
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {institution.name} · {institution.department} · {activeRound.name}
              </p>
            </div>
          </div>

          {/* Export Actions with Review Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Review Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Export Review
              </label>
              <select
                value={selectedExportReviewId}
                onChange={e => setSelectedExportReviewId(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '220px', borderColor: '#3730A3', color: '#3730A3', cursor: 'pointer' }}
              >
                {reviewRounds.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.isActive ? '🟢 ' : ''}{r.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                onClick={() => exportConsolidatedExcel(selectedExportReviewId)}
                className="btn btn-success"
                style={{ gap: '0.5rem', boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)', fontSize: '0.85rem' }}
                title={`Download CSV for ${selectedExportRound?.name} — opens in Google Sheets & Excel`}
              >
                <FileSpreadsheet size={16} />
                Download CSV (Google Sheets)
              </button>
              <button
                onClick={handleExportPDF}
                className="btn btn-outline"
                style={{ gap: '0.5rem', fontSize: '0.85rem', borderColor: '#7C3AED', color: '#7C3AED' }}
                title={`Download PDF for ${selectedExportRound?.name}`}
              >
                <FileText size={16} />
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setViewTab('evaluations')}
          className={`btn ${viewTab === 'evaluations' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.5rem' }}
        >
          <Award size={16} /> Consolidated Mark Matrix & Live Review
        </button>

        <button
          onClick={() => setViewTab('faculty')}
          className={`btn ${viewTab === 'faculty' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.5rem' }}
        >
          <Users size={16} /> Official Department Faculty Directory ({facultyDirectory.length} Members)
        </button>
      </div>

      {viewTab === 'evaluations' ? (
        <>
          {/* KPI Statistic Cards — with SVG Progress Rings */}
          <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
            {/* Card 1: Total Teams */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressRing
                value={100}
                size={72}
                color="var(--color-primary)"
                trackColor="#E0E7FF"
                label={teams.length}
                sublabel="TEAMS"
                fontSize="1.3rem"
              />
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Registered</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{teams.length} Teams</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>All mentees mapped to faculty</div>
              </div>
            </div>

            {/* Card 2: Active Panels */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ProgressRing
                value={100}
                size={72}
                color="#7C3AED"
                trackColor="#EDE9FE"
                label={panels.length}
                sublabel="PANELS"
                fontSize="1.3rem"
              />
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active 3-Jury</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#7C3AED' }}>{panels.length} Panels</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{panels.length * 3} Faculty Juries total</div>
              </div>
            </div>

            {/* Card 3: Evaluations Completed */}
            {(() => {
              const completedPct = teams.length > 0 ? Math.round((totalCompletedCount / teams.length) * 100) : 0;
              return (
                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ProgressRing
                    value={completedPct}
                    size={72}
                    color={completedPct >= 100 ? '#16a34a' : completedPct >= 50 ? '#d97706' : '#3730A3'}
                    trackColor={completedPct >= 100 ? '#dcfce7' : '#E0E7FF'}
                    label={`${completedPct}%`}
                    sublabel="DONE"
                    fontSize="1rem"
                  />
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluations</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#166534' }}>{totalCompletedCount} / {teams.length}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Fully scored by 3 juries</div>
                  </div>
                </div>
              );
            })()}

            {/* Card 4: Dept Average */}
            {(() => {
              const avgPct = Math.round((parseFloat(deptAvg) / 50) * 100);
              return (
                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ProgressRing
                    value={avgPct}
                    size={72}
                    color={avgPct >= 80 ? '#16a34a' : avgPct >= 60 ? '#d97706' : '#3730A3'}
                    trackColor="#E0E7FF"
                    label={deptAvg}
                    sublabel="/ 50"
                    fontSize="0.9rem"
                  />
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dept Average</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{deptAvg} / 50</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Target threshold: 40.0 / 50</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Live Department Review Command Center Card — Multi-Panel Grid */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header" style={{ background: '#F8FAFC', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                  Live Review Command Center — All {panels.length} Panels Operational Status
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Real-time monitoring across all 5 laboratory venues, jury compositions & presentation queues
                </p>
              </div>
              <span className="status-badge inviva">{panels.length} Panels Active · Real-time</span>
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                {panels.map(p => {
                  const inVivaTeam = teams.find(t => t.id === p.activeTeamId);
                  const standbyTeam = teams.find(t => t.id === p.standbyTeamId);
                  const completedInPanel = p.teamQueue ? p.teamQueue.filter(q => q.status === 'COMPLETED').length : 0;
                  const totalInPanel = p.teamQueue ? p.teamQueue.length : 0;
                  const pct = totalInPanel > 0 ? Math.round((completedInPanel / totalInPanel) * 100) : 0;

                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '1.15rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', background: '#3730A3', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {p.code}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {completedInPanel}/{totalInPanel} Done ({pct}%)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                          📍 {p.venue}
                        </div>
                      </div>

                      {/* 3 Juries in this panel */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {p.juries.map(j => (
                          <div
                            key={j.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: '#FFFFFF',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.7rem'
                            }}
                            title={`${j.name} (${j.designation})`}
                          >
                            {j.photo && (
                              <img
                                src={j.photo}
                                alt={j.name}
                                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            )}
                            <span style={{ fontWeight: 600 }}>J{j.position}:</span> {j.name.split(' ').slice(1).join(' ') || j.name}
                          </div>
                        ))}
                      </div>

                      {/* In Viva & Standby Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                            🟢 In Viva
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                            {inVivaTeam ? inVivaTeam.code : 'Idle'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                            🟡 Standby
                          </div>
                          <div style={{ fontWeight: 800, color: '#92400E' }}>
                            {standbyTeam ? standbyTeam.code : 'None'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            Queue Slot
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            20m Slots
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MASTER CONSOLIDATED MARK SHEET TABLE */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                  Master Consolidated Evaluation Sheet — {selectedExportRound.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Individual scores by Jury 1, Jury 2, Jury 3 + Evaluated Average (/50) across all {panels.length} panels
                </p>
              </div>

              {/* Filter and Search Bar */}
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Review Filter for Table View */}
                <select
                  value={selectedExportReviewId}
                  onChange={e => setSelectedExportReviewId(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', fontSize: '0.8rem', fontWeight: 700, borderColor: '#7C3AED', color: '#7C3AED' }}
                  title="View marks for a specific review"
                >
                  {reviewRounds.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.isActive ? '🟢 ' : ''}{r.code}: {r.name.split(':')[1]?.trim() || r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPanelFilter}
                  onChange={e => setSelectedPanelFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--color-primary)' }}
                >
                  <option value="ALL">All Panels ({teams.length} Teams)</option>
                  {panels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code}: {p.venue.split('-')[0].trim()}
                    </option>
                  ))}
                </select>

                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filter by title, mentor, roll..."
                    className="form-input"
                    style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Team No.</th>
                      <th>Panel No.</th>
                      <th>Project Title</th>
                      <th>Students</th>
                      <th>Mentor</th>
                      <th style={{ textAlign: 'center' }}>Jury 1 (/50)</th>
                      <th style={{ textAlign: 'center' }}>Jury 2 (/50)</th>
                      <th style={{ textAlign: 'center' }}>Jury 3 (/50)</th>
                      <th style={{ textAlign: 'center' }}>Avg. (/50)</th>
                      <th>Artifacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team, idx) => {
                      const teamPanel = panels.find(p => p.id === team.panelId) || panels[0];
                      const teamEvals = evaluations.filter(
                        e => e.teamId === team.id && e.reviewRoundId === selectedExportReviewId
                      );

                      const j1User = teamPanel.juries[0];
                      const j2User = teamPanel.juries[1];
                      const j3User = teamPanel.juries[2];

                      const j1 = teamEvals.find(e => e.juryId === j1User?.id);
                      const j2 = teamEvals.find(e => e.juryId === j2User?.id);
                      const j3 = teamEvals.find(e => e.juryId === j3User?.id);

                      const validScores = [j1?.totalScore, j2?.totalScore, j3?.totalScore].filter(
                        s => s !== undefined && s !== null
                      );
                      const avg =
                        validScores.length > 0
                          ? (validScores.reduce((a, b) => a + Number(b), 0) / validScores.length).toFixed(2)
                          : null;

                      return (
                        <tr key={team.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--color-primary)' }}>{team.code}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 800,
                                color: '#3730A3',
                                background: '#EEF2FF',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}
                              title={teamPanel.venue}
                            >
                              {teamPanel.code}
                            </span>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{team.title}</div>
                            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                              Progress: {team.progressPercentage}%
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.825rem' }}>
                              {team.members.map(m => (
                                <div key={m.id}>
                                  {m.name} (<strong>{m.rollNo}</strong>)
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{team.mentorName}</span>
                          </td>

                          {/* Jury 1 Score — with sparkline bar */}
                          <td style={{ textAlign: 'center' }}>
                            {j1 ? (() => {
                              const pct = Math.round((Number(j1.totalScore) / 50) * 100);
                              const c = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }} title={j1User?.name}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: c }}>{Number(j1.totalScore).toFixed(1)}</span>
                                  <div style={{ width: '44px', height: '5px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: '99px', transition: 'width 0.3s' }} />
                                  </div>
                                </div>
                              );
                            })() : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                          </td>

                          {/* Jury 2 Score — with sparkline bar */}
                          <td style={{ textAlign: 'center' }}>
                            {j2 ? (() => {
                              const pct = Math.round((Number(j2.totalScore) / 50) * 100);
                              const c = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }} title={j2User?.name}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: c }}>{Number(j2.totalScore).toFixed(1)}</span>
                                  <div style={{ width: '44px', height: '5px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: '99px', transition: 'width 0.3s' }} />
                                  </div>
                                </div>
                              );
                            })() : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                          </td>

                          {/* Jury 3 Score — with sparkline bar */}
                          <td style={{ textAlign: 'center' }}>
                            {j3 ? (() => {
                              const pct = Math.round((Number(j3.totalScore) / 50) * 100);
                              const c = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }} title={j3User?.name}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: c }}>{Number(j3.totalScore).toFixed(1)}</span>
                                  <div style={{ width: '44px', height: '5px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: '99px', transition: 'width 0.3s' }} />
                                  </div>
                                </div>
                              );
                            })() : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>}
                          </td>

                          {/* Avg — color-coded badge */}
                          <td style={{ textAlign: 'center' }}>
                            {avg ? (() => {
                              const avgPct = Math.round((parseFloat(avg) / 50) * 100);
                              const c = avgPct >= 70 ? '#16a34a' : avgPct >= 50 ? '#d97706' : '#dc2626';
                              const bg = avgPct >= 70 ? '#dcfce7' : avgPct >= 50 ? '#fef3c7' : '#fee2e2';
                              return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: bg, borderRadius: '6px', padding: '0.25rem 0.55rem' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: c, fontFamily: 'var(--font-display)' }}>{avg}</span>
                                  <span style={{ fontSize: '0.7rem', color: c, fontWeight: 600 }}>/50</span>
                                </div>
                              );
                            })() : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Pending</span>
                            )}
                          </td>

                          {/* Clickable Deliverables Triad */}
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() =>
                                  setModalConfig({
                                    isOpen: true,
                                    title: `${team.code} GitHub`,
                                    url: team.githubUrl,
                                    type: 'github'
                                  })
                                }
                                className="deliverable-link"
                                title="Inspect GitHub Source Code"
                              >
                                <GithubIcon size={13} color="#3730A3" /> Git
                              </button>

                              <button
                                onClick={() =>
                                  setModalConfig({
                                    isOpen: true,
                                    title: `${team.code} Presentation PPT`,
                                    url: team.pptUrl,
                                    type: 'ppt'
                                  })
                                }
                                className="deliverable-link"
                                title="Open Presentation Slides"
                              >
                                <Presentation size={13} color="#7C3AED" /> PPT
                              </button>

                              <button
                                onClick={() =>
                                  setModalConfig({
                                    isOpen: true,
                                    title: `${team.code} Live Deployed Prototype`,
                                    url: team.demoUrl,
                                    type: 'demo'
                                  })
                                }
                                className="deliverable-link"
                                title="Launch Deployed Application"
                                style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}
                              >
                                <Globe size={13} color="#166534" /> Demo
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* SECTION: OFFICIAL FACULTY DIRECTORY (30 Faculty Members) */
        <div className="card">
          <div className="card-header" style={{ background: '#F8FAFC', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                Department of Information Technology — Official Faculty Directory
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                30 Recognized Faculty Members · Mentors, Review Juries, and Department Coordinators
              </p>
            </div>

            {/* Faculty Search */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search faculty name, designation..."
                className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {filteredFaculty.map(fac => {
                const isHod = fac.isHOD;

                return (
                  <div
                    key={fac.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isHod ? 'var(--color-highlight-soft)' : '#FFFFFF',
                      border: isHod ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={fac.photo}
                      alt={fac.name}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid var(--color-border)',
                        flexShrink: 0
                      }}
                      onError={e => {
                        e.target.src = 'https://via.placeholder.com/60?text=KEC';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: 'var(--color-text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {fac.name}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isHod ? '#166534' : 'var(--color-primary)',
                          marginBottom: '0.2rem'
                        }}
                      >
                        {fac.designation}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        <Mail size={11} /> {fac.email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Deliverables Launcher Modal */}
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
