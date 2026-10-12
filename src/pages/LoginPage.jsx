import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Scale,
  Settings,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
  const { users, institution, switchRole } = useApp();

  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState('22ITR112');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // When tab changes, update default identifier
  const handleRoleTabChange = role => {
    setSelectedRole(role);
    setErrorMessage('');
    switch (role) {
      case 'student':
        setIdentifier('22ITR112');
        break;
      case 'jury':
        setIdentifier('KEC-IT-002'); // Dr. J. Premalatha
        break;
      case 'admin':
        setIdentifier('KEC-IT-LA01'); // Mr. Senthilkumar
        break;
      case 'super_admin':
        setIdentifier('KEC-IT-HOD'); // Dr. S. Varadhaganapathy
        break;
      default:
        break;
    }
  };

  const handleQuickLogin = (role, userId) => {
    switchRole(role, userId);
    onLoginSuccess();
  };

  const handleSubmit = e => {
    e.preventDefault();
    setErrorMessage('');

    // Find matching user by rollNo, empId, or email
    const trimmed = identifier.trim().toLowerCase();
    const matched = users.find(u => {
      const matchRoll = u.rollNo && u.rollNo.toLowerCase() === trimmed;
      const matchEmp = u.empId && u.empId.toLowerCase() === trimmed;
      const matchEmail = u.email && u.email.toLowerCase() === trimmed;
      const matchName = u.name && u.name.toLowerCase().includes(trimmed);
      return matchRoll || matchEmp || matchEmail || matchName;
    });

    if (matched) {
      switchRole(matched.role, matched.id);
      onLoginSuccess();
    } else {
      // Fallback: match by role
      const fallbackUser = users.find(u => u.role === selectedRole);
      if (fallbackUser) {
        switchRole(fallbackUser.role, fallbackUser.id);
        onLoginSuccess();
      } else {
        setErrorMessage('User credentials not found. Use one of the quick test accounts below.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3730A3 0%, #1E1B4B 60%, #0F172A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'var(--font-primary)'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Institutional Card Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3730A3 0%, #4338CA 100%)',
            padding: '2rem',
            color: '#FFFFFF',
            textAlign: 'center',
            position: 'relative',
            borderBottom: '4px solid #7C3AED'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem auto',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7C3AED, #3730A3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 900,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            K
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '0.02em', color: '#FFFFFF' }}>
            {institution.name.toUpperCase()}
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#C7D2FE', margin: '0.25rem 0 0.5rem 0', fontWeight: 600 }}>
            {institution.department}
          </p>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(4px)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 800,
              color: '#EDE9FE',
              letterSpacing: '0.04em'
            }}
          >
            PROJECT WORK EVALUATION PORTAL · 3-JURY SYSTEM
          </div>
        </div>

        {/* Card Body & Login Form */}
        <div style={{ padding: '2rem' }}>
          {/* Role Tabs */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Select Login Role
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                background: 'var(--color-bg-subtle)',
                padding: '0.3rem',
                borderRadius: '12px'
              }}
            >
              <button
                type="button"
                onClick={() => handleRoleTabChange('student')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  backgroundColor: selectedRole === 'student' ? '#3730A3' : 'transparent',
                  color: selectedRole === 'student' ? '#FFFFFF' : 'var(--color-text-body)'
                }}
              >
                <GraduationCap size={16} />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('jury')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  backgroundColor: selectedRole === 'jury' ? '#3730A3' : 'transparent',
                  color: selectedRole === 'jury' ? '#FFFFFF' : 'var(--color-text-body)'
                }}
              >
                <Scale size={16} />
                <span>Jury</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  backgroundColor: selectedRole === 'admin' ? '#3730A3' : 'transparent',
                  color: selectedRole === 'admin' ? '#FFFFFF' : 'var(--color-text-body)'
                }}
              >
                <Settings size={16} />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('super_admin')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  backgroundColor: selectedRole === 'super_admin' ? '#3730A3' : 'transparent',
                  color: selectedRole === 'super_admin' ? '#FFFFFF' : 'var(--color-text-body)'
                }}
              >
                <ShieldCheck size={16} />
                <span>HOD</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                {selectedRole === 'student' ? 'Student Roll Number / Email' : 'Staff Employee ID / Official Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'e.g. 22ITR112'
                      : selectedRole === 'admin'
                      ? 'e.g. KEC-IT-LA01 (Mr. Senthilkumar)'
                      : selectedRole === 'super_admin'
                      ? 'e.g. KEC-IT-HOD (Dr. S. Varadhaganapathy)'
                      : 'e.g. KEC-IT-002 (Dr. J. Premalatha)'
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Security Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--color-text-body)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Remember my login
              </label>
              <a href="#reset" onClick={e => { e.preventDefault(); alert('Please contact the IT Project Coordinator (Dr. S. Anandamurugan) to reset your departmental password.'); }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>

            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', background: '#FEF2F2', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', gap: '0.5rem', boxShadow: '0 4px 14px rgba(55, 48, 163, 0.3)' }}
            >
              Sign In to Evaluation Portal <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles (For Instant Testing) */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <Sparkles size={14} color="#7C3AED" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-main)', textTransform: 'uppercase' }}>
                1-Click Quick Demo Switcher
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('student', 'usr-stu-1')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem' }}
              >
                🎓 Yogeshwaran (22ITR112)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student', 'usr-stu-2')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem' }}
              >
                🎓 Karthik R (22ITR045)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('jury', 'usr-jury-1')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem' }}
              >
                ⚖️ Jury 1 (Dr. J. Premalatha)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('jury', 'usr-jury-2')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem' }}
              >
                ⚖️ Jury 2 (Dr. G. K. Kamalam)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'usr-admin')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem' }}
              >
                ⚙️ Admin (Mr. Senthilkumar · Lab Asst.)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('super_admin', 'usr-superadmin')}
                className="btn btn-soft btn-sm"
                style={{ fontSize: '0.725rem', justifyContent: 'flex-start', padding: '0.45rem 0.6rem', fontWeight: 800 }}
              >
                🏛️ HOD (Dr. Varadhaganapathy)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: 'var(--color-bg-subtle)', padding: '0.85rem', textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
          Autonomous · Affiliated to Anna University · Accredited by NAAC with 'A++' Grade
        </div>
      </div>
    </div>
  );
};
