import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { JuryPortal } from './pages/JuryPortal';
import { AdminPortal } from './pages/AdminPortal';
import { SuperAdminPortal } from './pages/SuperAdminPortal';
import { AlertTriangle, X } from 'lucide-react';

export const App = () => {
  const {
    currentRole,
    activeNotification,
    setActiveNotification,
    institution,
    isAuthenticated,
    login
  } = useApp();

  // Auto-dismiss notification toast after 6 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => setActiveNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [activeNotification, setActiveNotification]);

  // If user is not signed in, show the dedicated LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={login} />;
  }

  const renderActivePortal = () => {
    switch (currentRole) {
      case 'student':
        return <StudentPortal />;
      case 'jury':
        return <JuryPortal />;
      case 'admin':
        return <AdminPortal />;
      case 'super_admin':
      default:
        return <SuperAdminPortal />;
    }
  };

  return (
    <div className="app-container">
      {/* Primary Brand Navigation */}
      <Header />

      {/* Floating System Notification Toast */}
      {activeNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            maxWidth: '420px',
            background: '#FFFFFF',
            borderLeft: '5px solid #92400E',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            padding: '1rem 1.25rem 0 1.25rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            animation: 'modal-pop 0.25s ease-out',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '0.75rem' }}>
            <AlertTriangle size={22} color="#92400E" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#92400E' }}>
                {activeNotification.title}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-body)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                {activeNotification.message}
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Broadcasted at {activeNotification.timestamp} · closes in 6s
              </span>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '2px'
              }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Auto-dismiss countdown bar */}
          <div style={{ height: '3px', background: '#FEF3C7', margin: '0 -1.25rem' }}>
            <div
              key={activeNotification.timestamp}
              style={{
                height: '100%',
                background: '#92400E',
                animation: 'toast-countdown 6s linear forwards'
              }}
            />
          </div>
          <style>{`
            @keyframes toast-countdown {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}

      {/* Main Page Workspace */}
      <main className="main-content">{renderActivePortal()}</main>

      {/* Institutional Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          background: '#FFFFFF',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          fontSize: '0.775rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>{institution.name}</strong> · {institution.department} · {institution.batch}
        </p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.725rem' }}>
          Project Work Evaluation System · 3-Jury Panel Aggregation · Phase-Specific 50M Rubrics · Automated Excel Reports
        </p>
      </footer>
    </div>
  );
};

export default App;
