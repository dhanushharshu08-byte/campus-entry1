import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { CampuSentryShield } from '../components/brand/CollegeBrandLogo';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  School, 
  Wrench, 
  ShieldCheck,
  User
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname;

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(fromPath || getDashboardRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, fromPath]);

  React.useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      setSuccessMsg('Registration completed! Please enter your password to log in.');
    }
  }, [location.state]);

  const quickRoles = [
    { label: 'Student', email: 'student@acetcbe.edu.in', pass: 'Student@123', icon: GraduationCap, color: '#059669' },
    { label: 'Faculty', email: 'faculty@acetcbe.edu.in', pass: 'Faculty@123', icon: School, color: '#7c3aed' },
    { label: 'Maintenance', email: 'maintenance@college.edu', pass: 'Tech@123', icon: Wrench, color: '#d97706' },
    { label: 'Management', email: 'admin@college.edu', pass: 'Admin@123', icon: ShieldCheck, color: '#2563eb' },
  ];

  const handleSelectRole = (r) => {
    setEmail(r.email);
    setPassword(r.pass);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFormError('Please enter your campus email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email: trimmedEmail, password });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Welcome, ${result.user.name || result.user.email}! Redirecting...`);
      setTimeout(() => {
        navigate(fromPath || result.redirect);
      }, 500);
    } else {
      setFormError(result.error || 'Invalid email or password.');
    }
  };

  return (
    <div 
      className="login-page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 68px - 4rem)',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 1rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="card login-card" 
        style={{ 
          width: '100%',
          maxWidth: '480px', 
          padding: '2.5rem 2rem',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <CampuSentryShield size={48} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.2rem', fontFamily: "'Outfit', sans-serif" }}>
            {COLLEGE_CONFIG.PROJECT_NAME}
          </h1>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-600)', marginBottom: '0.25rem' }}>
            Campus Helpdesk Portal
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)', margin: 0 }}>
            {COLLEGE_CONFIG.COLLEGE_NAME}
          </p>
        </div>

        {/* Quick Role Fill Selectors */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', textAlign: 'center' }}>
            Select Portal Account
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
            {quickRoles.map((r, idx) => {
              const RoleIcon = r.icon;
              const isSelected = email === r.email;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.2rem',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid var(--color-slate-200)',
                    background: isSelected ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RoleIcon size={16} color={r.color} />
                  <span style={{ fontSize: '0.725rem', fontWeight: isSelected ? 700 : 500, color: 'var(--color-slate-700)' }}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {formError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-danger-50)',
              border: '1px solid #fecaca',
              color: 'var(--color-danger-700)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-success-50)',
              border: '1px solid #a7f3d0',
              color: 'var(--color-success-700)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="email" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Campus Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. rollno@acetcbe.edu.in"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                autoComplete="email"
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="password" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 0 }}>
                Password
              </label>
              <span 
                onClick={() => alert(`Please contact the campus IT Helpdesk at ${COLLEGE_CONFIG.COLLEGE_PHONE} to reset your credentials.`)} 
                style={{ fontSize: '0.75rem', color: 'var(--color-brand-600)', cursor: 'pointer', fontWeight: 500 }}
              >
                Forgot Password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                autoComplete="current-password"
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <Lock
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-slate-400)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In to Helpdesk'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
          Don't have an institutional account?{' '}
          <Link to="/register" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>
            Register as Student / Faculty
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
