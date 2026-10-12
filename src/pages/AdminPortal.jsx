import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Users,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Layers,
  Shield,
  Edit2,
  ArrowRight,
  UserPlus,
  UserMinus,
  FolderPlus,
  FolderMinus,
  Save,
  AlertCircle
} from 'lucide-react';

export const AdminPortal = () => {
  const {
    reviewRounds,
    activeReviewId,
    setActiveReviewId,
    rubrics,
    updateRubricCriterion,
    addRubricCriterion,
    deleteRubricCriterion,
    panels,
    teams,
    users,
    facultyDirectory,
    updatePanelJuries,
    updatePanelTeamQueue
  } = useApp();

  const [selectedRoundTab, setSelectedRoundTab] = useState(activeReviewId);
  const activeRound = reviewRounds.find(r => r.id === selectedRoundTab) || reviewRounds[2];
  const roundRubrics = rubrics[selectedRoundTab] || [];

  // Admin section tab
  const [adminTab, setAdminTab] = useState('rubrics'); // 'rubrics' | 'panel'

  // New Criterion Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(10);
  const [editingId, setEditingId] = useState(null);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMarks, setEditMarks] = useState(10);

  const [selectedPanelId, setSelectedPanelId] = useState(panels[0]?.id || 'panel-01');
  const panel = panels.find(p => p.id === selectedPanelId) || panels[0];

  // Panel management state
  const [panelSaved, setPanelSaved] = useState(false);
  const [selectedFacultyToAdd, setSelectedFacultyToAdd] = useState('');
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('');

  // Draft juries & queue for the selected panel (editable)
  const [draftJuries, setDraftJuries] = useState(panel.juries);
  const [draftQueue, setDraftQueue] = useState(panel.teamQueue);

  // Sync drafts when panel changes
  const handleSelectPanel = (pid) => {
    setSelectedPanelId(pid);
    const p = panels.find(x => x.id === pid) || panels[0];
    setDraftJuries(p.juries);
    setDraftQueue(p.teamQueue);
    setPanelSaved(false);
  };

  // All KEC faculty available to assign as jury
  const availableFaculty = facultyDirectory.filter(
    f => !draftJuries.some(j => j.id === f.id)
  );

  // Teams not yet in this panel's queue
  const teamsNotInPanel = teams.filter(
    t => !draftQueue.some(q => q.teamId === t.id)
  );

  const handleAddJury = () => {
    if (!selectedFacultyToAdd) return;
    if (draftJuries.length >= 3) {
      alert('A panel can have at most 3 jury members. Remove one first.');
      return;
    }
    const faculty = facultyDirectory.find(f => f.id === selectedFacultyToAdd);
    if (!faculty) return;
    const newJury = {
      id: faculty.id,
      name: faculty.name,
      designation: faculty.designation || faculty.role,
      empId: faculty.empId || faculty.id,
      position: draftJuries.length + 1,
      photo: faculty.photo || null
    };
    setDraftJuries(prev => [...prev, newJury]);
    setSelectedFacultyToAdd('');
    setPanelSaved(false);
  };

  const handleRemoveJury = (juryId) => {
    setDraftJuries(prev => {
      const updated = prev.filter(j => j.id !== juryId);
      // Re-number positions
      return updated.map((j, i) => ({ ...j, position: i + 1 }));
    });
    setPanelSaved(false);
  };

  const handleAddTeam = () => {
    if (!selectedTeamToAdd) return;
    const team = teams.find(t => t.id === selectedTeamToAdd);
    if (!team) return;
    const order = draftQueue.length + 1;
    // Auto-assign 20-min slots starting from 9:00 AM
    const startMinutes = 9 * 60 + (order - 1) * 20;
    const endMinutes = startMinutes + 20;
    const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const newItem = {
      teamId: team.id,
      queueOrder: order,
      slotStart: fmt(startMinutes),
      slotEnd: fmt(endMinutes),
      status: 'WAITING'
    };
    setDraftQueue(prev => [...prev, newItem]);
    setSelectedTeamToAdd('');
    setPanelSaved(false);
  };

  const handleRemoveTeam = (teamId) => {
    setDraftQueue(prev => {
      const updated = prev.filter(q => q.teamId !== teamId);
      // Re-number queue order and recalculate slots
      return updated.map((item, i) => {
        const startMinutes = 9 * 60 + i * 20;
        const endMinutes = startMinutes + 20;
        const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        return { ...item, queueOrder: i + 1, slotStart: fmt(startMinutes), slotEnd: fmt(endMinutes) };
      });
    });
    setPanelSaved(false);
  };

  const handleSavePanelChanges = () => {
    updatePanelJuries(selectedPanelId, draftJuries);
    updatePanelTeamQueue(selectedPanelId, draftQueue);
    setPanelSaved(true);
    setTimeout(() => setPanelSaved(false), 3000);
  };

  const facultyMembers = users.filter(u => u.role === 'jury' || u.role === 'mentor');


  const handleStartEdit = crit => {
    setEditingId(crit.id);
    setEditTitle(crit.title);
    setEditDesc(crit.desc);
    setEditMarks(crit.maxMarks);
  };

  const handleSaveEdit = critId => {
    updateRubricCriterion(selectedRoundTab, critId, {
      title: editTitle,
      desc: editDesc,
      maxMarks: parseFloat(editMarks) || 10
    });
    setEditingId(null);
  };

  const handleAddCriterion = e => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const code = `C${roundRubrics.length + 1}`;
    const newCrit = {
      id: `${selectedRoundTab}-${code}-${Date.now()}`,
      code,
      title: newTitle,
      desc: newDesc,
      maxMarks: parseFloat(newMaxMarks) || 10
    };

    addRubricCriterion(selectedRoundTab, newCrit);
    setNewTitle('');
    setNewDesc('');
    setNewMaxMarks(10);
    setShowAddForm(false);
  };

  const totalPossibleScore = roundRubrics.reduce((acc, curr) => acc + curr.maxMarks, 0);

  return (
    <div>
      {/* Admin Coordinator Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', background: '#3730A3', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                ADMIN DASHBOARD
              </span>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-text-main)' }}>
                Academic Project Review Admin Portal
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Evaluation Administrator: <strong style={{ color: '#3730A3' }}>Mr. Senthilkumar</strong> (Lab Assistant · Emp ID: <strong>KEC-IT-LA01</strong>) — Authority to configure review rubrics, assign jury panels & schedule student slots.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#3730A3',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                SK
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3730A3', lineHeight: 1.2 }}>
                  Mr. Senthilkumar
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4B5563', fontWeight: 600 }}>
                  Lab Assistant · Admin
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                Active Dept Review:
              </span>
              <select
                className="form-select"
                style={{ width: 'auto', fontWeight: 700, borderColor: 'var(--color-primary)' }}
                value={activeReviewId}
                onChange={e => {
                  setActiveReviewId(e.target.value);
                  setSelectedRoundTab(e.target.value);
                }}
              >
                {reviewRounds.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setAdminTab('rubrics')}
          className={`btn ${adminTab === 'rubrics' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.5rem' }}
        >
          <Sliders size={16} />
          Rubrics Builder
        </button>
        <button
          onClick={() => setAdminTab('panel')}
          className={`btn ${adminTab === 'panel' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.5rem' }}
        >
          <Users size={16} />
          Panel & Team Management
        </button>
      </div>

      {adminTab === 'rubrics' && (
      <>{/* SECTION 1: DYNAMIC RUBRICS BUILDER (Strictly Admin Exclusive) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ background: '#F8FAFC', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Review-Specific Dynamic Rubrics Builder</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Each review phase possesses independent rubrics. Juries have strictly read-only access to this criteria set.
            </p>
          </div>

          {/* Phase Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {reviewRounds.map(round => (
              <button
                key={round.id}
                onClick={() => setSelectedRoundTab(round.id)}
                className={`btn btn-sm ${selectedRoundTab === round.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.775rem' }}
              >
                {round.code} ({round.name.split(':')[0]})
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {/* Phase Summary Bar */}
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-highlight-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              border: '1px solid #C7D2FE'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Active Rubric Configuration
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {activeRound.name}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Max Marks</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                  {totalPossibleScore} Marks
                </div>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-accent btn-sm"
              >
                <Plus size={15} /> Add New Criterion
              </button>
            </div>
          </div>

          {/* Add Criterion Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddCriterion}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: '2px dashed var(--color-accent)',
                marginBottom: '1.5rem'
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--color-accent)' }}>
                Add Custom Criterion to {activeRound.code}
              </h4>
              <div className="grid-3" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Criterion Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Test Coverage & CI/CD Pipeline"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description / Scope Focus</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Unit tests, integration validation, automated workflows"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    value={newMaxMarks}
                    onChange={e => setNewMaxMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent btn-sm">
                  Save Criterion
                </button>
              </div>
            </form>
          )}

          {/* Rubrics Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Code</th>
                  <th>Evaluation Criterion</th>
                  <th>Evaluation Scope & Focus</th>
                  <th style={{ width: '120px' }}>Max Marks</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roundRubrics.map(crit => {
                  const isEditing = editingId === crit.id;

                  return (
                    <tr key={crit.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                          {crit.code}
                        </span>
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-input"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                          />
                        ) : (
                          <strong>{crit.title}</strong>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-input"
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                          />
                        ) : (
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-text-body)' }}>
                            {crit.desc}
                          </span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="form-input"
                            style={{ width: '70px' }}
                            value={editMarks}
                            onChange={e => setEditMarks(e.target.value)}
                          />
                        ) : (
                          <span className="score-badge" style={{ fontSize: '0.85rem' }}>
                            {crit.maxMarks} Marks
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleSaveEdit(crit.id)}
                              className="btn btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-outline btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleStartEdit(crit)}
                              className="btn btn-outline btn-sm"
                              title="Edit criterion details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => deleteRubricCriterion(selectedRoundTab, crit.id)}
                              className="btn btn-outline btn-sm"
                              style={{ color: '#DC2626' }}
                              title="Delete criterion"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </> )}

      {/* SECTION 2: PANEL & TEAM MANAGEMENT (Admin Exclusive, tabbed) */}
      {adminTab === 'panel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Panel Selector */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                    Panel & Team Management — Admin Exclusive
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Assign faculty juries (max 3) and allocate student teams to each panel. Changes take effect after clicking Save.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {panels.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPanel(p.id)}
                    className={`btn btn-sm ${selectedPanelId === p.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body">
              {/* Panel info banner */}
              <div style={{
                padding: '0.85rem 1.1rem', borderRadius: '8px',
                background: '#EEF2FF', border: '1px solid #C7D2FE',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', background: '#3730A3', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {panel.code}
                    </span>
                    <strong style={{ color: '#1E1B4B' }}>{panel.name || panel.code}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem' }}>
                    📍 {panel.venue}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {draftJuries.length}/3 Juries · {draftQueue.length} Teams
                  </span>
                  {panelSaved && (
                    <span className="status-badge completed" style={{ fontSize: '0.75rem' }}>
                      <CheckCircle size={12} /> Saved!
                    </span>
                  )}
                </div>
              </div>

              <div className="grid-2" style={{ gap: '2rem' }}>

                {/* ── LEFT: JURY ASSIGNMENT ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={15} color="var(--color-primary)" />
                      Jury Members
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>({draftJuries.length}/3 max)</span>
                    </h4>
                  </div>

                  {/* Current juries */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {draftJuries.length === 0 && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                        No jury assigned yet. Add from faculty below.
                      </div>
                    )}
                    {draftJuries.map((jury, idx) => (
                      <div key={jury.id} style={{
                        padding: '0.75rem 1rem', borderRadius: '8px',
                        background: '#fff', border: '1px solid #C7D2FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#3730A3', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                          }}>
                            J{idx + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{jury.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{jury.designation}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveJury(jury.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.3rem 0.55rem' }}
                          title="Remove from panel"
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add jury from faculty */}
                  {draftJuries.length < 3 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={selectedFacultyToAdd}
                        onChange={e => setSelectedFacultyToAdd(e.target.value)}
                        style={{ fontSize: '0.8rem', flex: 1 }}
                      >
                        <option value="">— Select faculty to add —</option>
                        {availableFaculty.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.designation || f.department})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddJury}
                        disabled={!selectedFacultyToAdd}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '0.35rem', whiteSpace: 'nowrap' }}
                      >
                        <UserPlus size={14} /> Add
                      </button>
                    </div>
                  )}
                  {draftJuries.length >= 3 && (
                    <div style={{ fontSize: '0.78rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={13} /> Panel is full (3/3). Remove a jury to add another.
                    </div>
                  )}
                </div>

                {/* ── RIGHT: TEAM ASSIGNMENT ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={15} color="#7C3AED" />
                      Assigned Teams
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>({draftQueue.length} in queue)</span>
                    </h4>
                  </div>

                  {/* Current team queue */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {draftQueue.length === 0 && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                        No teams assigned. Add teams from the list below.
                      </div>
                    )}
                    {draftQueue.map((item, idx) => {
                      const team = teams.find(t => t.id === item.teamId);
                      if (!team) return null;
                      return (
                        <div key={item.teamId} style={{
                          padding: '0.6rem 0.85rem', borderRadius: '8px',
                          background: '#fff', border: '1px solid #DDD6FE',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '6px',
                              background: '#EDE9FE', color: '#7C3AED',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800, flexShrink: 0
                            }}>
                              #{idx + 1}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{team.code}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                <Clock size={10} style={{ marginRight: '2px' }} />{item.slotStart}–{item.slotEnd} · {team.title}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTeam(item.teamId)}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#DC2626', borderColor: '#FECACA', padding: '0.25rem 0.5rem', flexShrink: 0 }}
                            title="Remove from panel"
                          >
                            <FolderMinus size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add team */}
                  {teamsNotInPanel.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={selectedTeamToAdd}
                        onChange={e => setSelectedTeamToAdd(e.target.value)}
                        style={{ fontSize: '0.8rem', flex: 1 }}
                      >
                        <option value="">— Select team to add —</option>
                        {teamsNotInPanel.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.code} — {t.title.substring(0, 40)}{t.title.length > 40 ? '…' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddTeam}
                        disabled={!selectedTeamToAdd}
                        className="btn btn-sm"
                        style={{ gap: '0.35rem', whiteSpace: 'nowrap', background: '#7C3AED', color: '#fff' }}
                      >
                        <FolderPlus size={14} /> Add
                      </button>
                    </div>
                  )}
                  {teamsNotInPanel.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#166534', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '6px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={13} /> All teams are already assigned to panels.
                    </div>
                  )}
                </div>
              </div>

              {/* Save button */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                {panelSaved && (
                  <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={15} /> Changes saved to {panel.code}!
                  </span>
                )}
                <button
                  onClick={handleSavePanelChanges}
                  className="btn btn-primary"
                  style={{ gap: '0.5rem', boxShadow: '0 4px 12px rgba(55,48,163,0.25)' }}
                >
                  <Save size={16} />
                  Save Changes to {panel.code}
                </button>
              </div>
            </div>
          </div>

          {/* Read-only queue preview table */}
          <div className="card">
            <div className="card-header" style={{ background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="var(--color-primary)" />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>
                  {panel.code} — Current Queue Preview ({draftQueue.length} teams · 20-min slots)
                </h4>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Time Slot</th>
                    <th>Team Code</th>
                    <th>Project Title</th>
                    <th>Students</th>
                    <th>Mentor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {draftQueue.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        No teams in queue. Add teams above and save.
                      </td>
                    </tr>
                  )}
                  {draftQueue.map(item => {
                    const team = teams.find(t => t.id === item.teamId);
                    if (!team) return null;
                    return (
                      <tr key={item.teamId}>
                        <td><strong>#{item.queueOrder}</strong></td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <Clock size={13} color="var(--color-primary)" />
                            {item.slotStart} – {item.slotEnd}
                          </span>
                        </td>
                        <td><strong style={{ color: 'var(--color-primary)' }}>{team.code}</strong></td>
                        <td style={{ maxWidth: '220px' }}><strong>{team.title}</strong></td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {team.members.map(m => (
                            <div key={m.id}>{m.name} <strong>({m.rollNo})</strong></div>
                          ))}
                        </td>
                        <td>{team.mentorName}</td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase().replace('_', '')}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
