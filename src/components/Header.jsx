import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Scale,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-react';

export const Header = () => {
  const {
    institution,
    reviewRounds,
    activeReviewId,
    setActiveReviewId,
    currentRole,
    currentUser,
    switchRole,
    soundEnabled,
    setSoundEnabled,
    activeNotification,
    logout,
    users
  } = useApp();

  const activeRound = reviewRounds.find(r => r.id === activeReviewId) || reviewRounds[2];

  return (
    <header
      style={{
        backgroundColor: '#3730A3', // Royal Indigo Primary
        color: '#FFFFFF',
        borderBottom: '3px solid #7C3AED', // Violet Accent Line
        boxShadow: '0 4px 20px rgba(55, 48, 163, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Top Institutional Ribbon */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '0.45rem 2rem',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, letterSpacing: '0.04em', color: '#E0E7FF' }}>
            {institution.name.toUpperCase()}
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ color: '#C7D2FE', fontWeight: 600 }}>
            {institution.department}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#E0E7FF', opacity: 0.8 }}>Academic Cycle:</span>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{institution.academicYear}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'transparent',
              border: 'none',
              color: soundEnabled ? '#FDE68A' : '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            title={soundEnabled ? 'Alert Chime Active' : 'Alert Chime Muted'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        style={{
          padding: '0.875rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Brand & Active Phase Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED, #4338CA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                color: '#FFFFFF',
                boxShadow: '0 4px 10px rgba(124, 58, 237, 0.4)'
              }}
            >
              K
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  ProjectEval Portal
                </h1>
                <span
                  style={{
                    background: 'rgba(124, 58, 237, 0.35)',
                    border: '1px solid #8B5CF6',
                    color: '#EDE9FE',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}
                >
                  3-Jury System
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#C7D2FE', margin: 0 }}>
                Live Queue · 50M Rubrics · Automated Aggregation
              </p>
            </div>
          </div>

          {/* Active Review Selector */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '0.725rem', color: '#C7D2FE', fontWeight: 600 }}>Active Review:</span>
            <select
              value={activeReviewId}
              onChange={e => setActiveReviewId(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {reviewRounds.map(r => (
                <option key={r.id} value={r.id} style={{ background: '#3730A3', color: '#FFFFFF' }}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4-Role Navigation Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.3rem',
              borderRadius: '12px',
              display: 'flex',
              gap: '0.25rem'
            }}
          >
            {/* Student Role */}
            <button
              onClick={() => switchRole('student')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                backgroundColor: currentRole === 'student' ? '#7C3AED' : 'transparent',
                color: currentRole === 'student' ? '#FFFFFF' : '#C7D2FE'
              }}
            >
              <GraduationCap size={16} />
              <span>Student</span>
            </button>

            {/* Jury Role */}
            <button
              onClick={() => switchRole('jury')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                backgroundColor: currentRole === 'jury' ? '#7C3AED' : 'transparent',
                color: currentRole === 'jury' ? '#FFFFFF' : '#C7D2FE'
              }}
            >
              <Scale size={16} />
              <span>Faculty Jury</span>
            </button>

            {/* Admin Role */}
            <button
              onClick={() => switchRole('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                backgroundColor: currentRole === 'admin' ? '#7C3AED' : 'transparent',
                color: currentRole === 'admin' ? '#FFFFFF' : '#C7D2FE'
              }}
              title="Admin Portal - Mr. Senthilkumar (Lab Assistant)"
            >
              <Settings size={16} />
              <span>Admin (Lab Asst.)</span>
            </button>

            {/* Super Admin Role */}
            <button
              onClick={() => switchRole('super_admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
                backgroundColor: currentRole === 'super_admin' ? '#7C3AED' : 'transparent',
                color: currentRole === 'super_admin' ? '#FFFFFF' : '#C7D2FE'
              }}
            >
              <ShieldCheck size={16} />
              <span>Super Admin (HOD)</span>
            </button>
          </div>

          {/* Active User Identity Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '0.35rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {currentUser.photo ? (
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#C7D2FE' }}>
                {currentUser.role === 'student'
                  ? `${currentUser.rollNo} · Student`
                  : currentUser.role === 'admin'
                  ? `Lab Assistant · ${currentUser.empId || 'KEC-IT-LA01'}`
                  : `${currentUser.designation || 'Faculty'} · ${currentUser.empId || ''}`}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.75rem',
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.08)',
              gap: '0.35rem',
              fontWeight: 700
            }}
            title="Sign out to Login Screen"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
