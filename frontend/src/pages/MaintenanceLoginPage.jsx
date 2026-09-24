import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { CampuSentryShield } from '../components/brand/CollegeBrandLogo';
import { 
  Wrench, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  ArrowLeft,
  Briefcase,
  PhoneCall,
  HardHat,
  Cpu,
  Clock
} from 'lucide-react';

const MaintenanceLoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(fromPath || getDashboardRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, fromPath]);

  // Preset demo technician staff accounts for fast verification
  const quickStaffAccounts = [
    {
      title: 'Central Maintenance',
      department: 'General Facilities',
      id: 'TECH-MAIN-01',
      email: 'maintenance@college.edu',
      pass: 'Tech@123',
      icon: Wrench,
      color: '#d97706',
      bg: '#fef3c7'
    },
    {
      title: 'Electrical Division',
      department: 'Electrical Works',
      id: 'TECH-ELEC-01',
      email: 'electrician@college.edu',
      pass: 'Tech@123',
      icon: Zap,
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      title: 'Water & Plumbing',
      department: 'Public Health & Sanitation',
      id: 'TECH-PLUMB-01',
      email: 'maintenance@acetcbe.edu.in',
      pass: 'Tech@123',
      icon: Droplets,
      color: '#0284c7',
      bg: '#e0f2fe'
    },
    {
      title: 'IT & Network Hardware',
      department: 'Campus Infrastructure',
      id: 'TECH-IT-01',
      email: 'maintenance@college.edu',
      pass: 'Tech@123',
      icon: Cpu,
      color: '#7c3aed',
      bg: '#f3e8ff'
    }
  ];

  const handleSelectStaff = (account) => {
    setIdentifier(account.email);
    setPassword(account.pass);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setFormError('Please enter your Staff Email or Employee / Technician ID.');
      return;
    }
    if (!password) {
      setFormError('Please enter your maintenance portal password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email: cleanInput, password });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Welcome, ${result.user.name || result.user.email}! Loading work orders...`);
      const rolePrefix = `/${result.user.role}/`;
      const safeFrom = fromPath && fromPath.startsWith(rolePrefix) ? fromPath : null;
      setTimeout(() => {
        navigate(safeFrom || result.redirect || '/maintenance/dashboard');
      }, 500);
    } else {
      setFormError(result.error || 'Invalid credentials. Please verify your Staff Email/ID and Password.');
    }
  };

  return (
    <div 
      className="maintenance-login-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 68px - 4rem)',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="card"
        style={{ 
          width: '100%',
          maxWidth: '520px', 
          padding: '2.5rem 2.25rem',
          margin: '0 auto',
          boxSizing: 'border-box',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          background: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Top Accent Strip */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            background: 'linear-gradient(90deg, #d97706, #f59e0b, #b45309)'
          }}
        />

        {/* Back Link to Main Hub */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Link 
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-slate-500)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={14} />
            <span>General Portal</span>
          </Link>

          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#92400e',
              backgroundColor: '#fef3c7',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid #fde68a'
            }}
          >
            <HardHat size={12} />
            Technician Gateway
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div 
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: '#fffbeb',
                border: '2px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
              }}
            >
              <Wrench size={30} />
            </div>
          </div>
          <h1 
            style={{ 
              fontSize: '1.65rem', 
              fontWeight: 800, 
              color: 'var(--color-slate-900)', 
              marginBottom: '0.25rem', 
              fontFamily: "'Outfit', sans-serif" 
            }}
          >
            Maintenance Operations
          </h1>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d97706', marginBottom: '0.25rem' }}>
            Field Technician &amp; Staff Login
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
            {COLLEGE_CONFIG.COLLEGE_NAME} &bull; Estate &amp; Facilities Redressal
          </p>
        </div>

        {/* Dispatch Status Live Banner */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            marginBottom: '1.25rem',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0f766e', fontWeight: 600 }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span>Work Order Dispatch Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
            <Clock size={12} />
            <span>24/7 On-Call Support</span>
          </div>
        </div>

        {/* Quick Demo Staff Pickers */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              fontSize: '0.725rem', 
              fontWeight: 700, 
              color: 'var(--color-slate-500)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em', 
              marginBottom: '0.5rem', 
              textAlign: 'center' 
            }}
          >
            Quick Select Demo Technician
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {quickStaffAccounts.map((acc, idx) => {
              const Icon = acc.icon;
              const isSelected = identifier === acc.email;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectStaff(acc)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.6rem 0.7rem',
                    borderRadius: '10px',
                    border: isSelected ? `2px solid ${acc.color}` : '1px solid var(--color-slate-200)',
                    background: isSelected ? acc.bg : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                    <Icon size={13} color={acc.color} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: acc.color }}>
                      {acc.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-slate-600)', fontWeight: 600 }}>
                    {acc.department}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-slate-400)', fontFamily: 'monospace' }}>
                    {acc.id} &bull; Tech@123
                  </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Staff Email or Tech ID */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label 
              className="form-label" 
              htmlFor="identifier" 
              style={{ fontWeight: 600, fontSize: '0.825rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>Staff Email or Technician ID</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-slate-400)', fontWeight: 400 }}>e.g. TECH-MAIN-01</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="maintenance@college.edu or TECH-MAIN-01"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setFormError(null); }}
                autoComplete="username"
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

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="maint-password" style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: 0 }}>
                Technician Access PIN / Password
              </label>
              <span 
                onClick={() => alert(`Maintenance credentials are managed by Campus Estate. Contact admin at ${COLLEGE_CONFIG.COLLEGE_PHONE}.`)} 
                style={{ fontSize: '0.72rem', color: '#d97706', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset Help?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="maint-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter technician password"
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn"
            style={{ 
              width: '100%', 
              padding: '0.8rem', 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              marginBottom: '1.25rem',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.3)'
            }}
            disabled={isSubmitting}
          >
            <Wrench size={16} />
            <span>{isSubmitting ? 'Authenticating Technician...' : 'Access Maintenance Portal'}</span>
          </button>
        </form>

        {/* Institutional notice & alternate portal navigation */}
        <div 
          style={{ 
            padding: '0.85rem', 
            borderRadius: '10px', 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            fontSize: '0.75rem', 
            color: 'var(--color-slate-600)',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>Estate Staff Provisioning Notice</span>
          </div>
          <div>
            Maintenance accounts are issued by College Administration. If you are newly joined or need account creation, request your Department Lead or Administrator to register you via Management Staff Portal.
          </div>
        </div>

        {/* Bottom Switch Links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid var(--color-slate-200)', paddingTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--color-brand-600)', fontWeight: 600, textDecoration: 'none' }}>
            &larr; Student / Faculty Login
          </Link>
          <Link to="/register" style={{ color: 'var(--color-slate-600)', textDecoration: 'none' }}>
            Student Registration &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLoginPage;
