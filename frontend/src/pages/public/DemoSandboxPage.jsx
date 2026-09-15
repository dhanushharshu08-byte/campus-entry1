import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../../context/AuthContext';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Wrench, 
  Building2, 
  Wifi, 
  GraduationCap, 
  School, 
  ArrowRight, 
  CheckCircle2, 
  Lock,
  Play,
  RotateCcw
} from 'lucide-react';

const DEMO_ROSTER = [
  {
    role: 'student',
    roleLabel: 'Student Complainant',
    name: 'John Doe',
    email: 'student@acetcbe.edu.in',
    password: 'Student@123',
    icon: GraduationCap,
    color: '#059669',
    bg: '#ecfdf5',
    desc: 'Submit maintenance requests for hostels, classrooms, and campus grounds with photo evidence and live status tracking.',
    keyActions: ['Fast Grievance Submission', 'Attach Damage Proof Photo', 'Live Real-Time Status Tracking', 'Confirm Final Closure or Reopen']
  },
  {
    role: 'faculty',
    roleLabel: 'Faculty Member',
    name: 'Prof. Sarah Smith',
    email: 'faculty@acetcbe.edu.in',
    password: 'Faculty@123',
    icon: School,
    color: '#7c3aed',
    bg: '#f5f3ff',
    desc: 'Priority reporting for academic labs, departmental offices, lecture halls, and audiovisual equipment.',
    keyActions: ['Priority Academic Lab Reporting', 'Department Specific Routing', 'Resolution Verification Sign-off', 'Department Maintenance History']
  },
  {
    role: 'maintenance',
    roleLabel: 'Central Maintenance Helpdesk',
    name: 'Central Maintenance Staff',
    email: 'maintenance@college.edu',
    password: 'Tech@123',
    icon: Wrench,
    color: '#d97706',
    bg: '#fffbeb',
    desc: 'Centralized helpdesk queue across all college maintenance divisions (Electrical, Plumbing, Civil, IT / Network, etc.).',
    keyActions: ['Unified Multi-Department Queue', 'Work Acceptance & In Progress Tracking', 'Resolution Proof Photo Upload', 'Detailed Resolution Remarks']
  },
  {
    role: 'management',
    roleLabel: 'Campus Management Executive',
    name: 'Campus Administrator',
    email: 'admin@college.edu',
    password: 'Admin@123',
    icon: Shield,
    color: '#2563eb',
    bg: '#eff6ff',
    desc: 'Campus-wide SLA monitoring, department workload analytics, staff roster oversight, and 4 streaming CSV exports.',
    keyActions: ['Live Helpdesk Dashboard & Metrics', 'Technician Reassignments & Overrides', 'Immutable Security Audit Logs', 'Department & Staff Roster Admin']
  }
];

const DemoSandboxPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickLogin = async (acc) => {
    setLoadingRole(acc.email);
    setErrorMsg('');
    try {
      const res = await login(acc.email, acc.password);
      if (res && res.success) {
        navigate(getDashboardRoute(res.user?.role || acc.role));
      } else {
        setErrorMsg(res?.message || 'Login failed.');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="demo-sandbox-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#c084fc', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <Sparkles size={14} />
            <span>Interactive Multi-Role Playground</span>
          </div>
          <h1 className="page-header-title">1-Click Role Sandbox & Demo Matrix</h1>
          <p className="page-header-subtitle">
            Experience CampuSentry instantly as any stakeholder. Click any account below to authenticate and explore that persona&rsquo;s live workspace.
          </p>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', borderRadius: '12px' }}>
            {errorMsg}
          </div>
        )}

        {/* Guided Test Scenario Walkthrough */}
        <div className="card" style={{ padding: '1.5rem 2rem', borderRadius: '16px', border: '1px solid var(--color-brand-200)', background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <Sparkles size={20} color="var(--color-brand-600)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-900)', margin: 0 }}>
              Recommended End-to-End Test Workflow
            </h3>
          </div>
          <ol style={{ fontSize: '0.88rem', color: 'var(--color-slate-700)', paddingLeft: '1.25rem', lineHeight: 1.6, margin: 0 }}>
            <li><strong>Launch as Student:</strong> Submit an Electrical issue with a location and photo attachment.</li>
            <li><strong>Auto-Assignment:</strong> The system automatically dispatches the ticket to <strong>Alex Vance (Electrician)</strong>.</li>
            <li><strong>Launch as Electrician:</strong> View the new work order in the job queue, accept it, and upload a resolution photo.</li>
            <li><strong>Verify Public Tracker:</strong> Visit <Link to="/track" style={{ fontWeight: 600 }}>/track</Link> to observe the updated status timeline.</li>
            <li><strong>Launch as Administrator:</strong> Inspect live SLA compliance metrics, dynamic settings, and export CSV analytics reports.</li>
          </ol>
        </div>

        {/* 7 Accounts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {DEMO_ROSTER.map((acc, idx) => {
            const IconComp = acc.icon;
            const isLoading = loadingRole === acc.email;

            return (
              <div
                key={idx}
                className="card demo-account-full-card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid var(--color-slate-200)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: acc.bg, color: acc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                          {acc.roleLabel}
                        </h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-slate-500)' }}>
                          {acc.name}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: acc.bg, color: acc.color, textTransform: 'uppercase' }}>
                      {acc.role}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {acc.desc}
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Key Capabilities:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {acc.keyActions.map((act, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-slate-700)' }}>
                          <CheckCircle2 size={13} color={acc.color} style={{ flexShrink: 0 }} />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)', fontFamily: 'monospace', backgroundColor: 'var(--color-slate-50)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--color-slate-200)' }}>
                    <strong>Email:</strong> {acc.email} | <strong>Pass:</strong> {acc.password}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontWeight: 600,
                    backgroundColor: acc.color,
                    borderColor: acc.color,
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <Play size={15} />
                      <span>Launch as {acc.roleLabel.split(' ')[0]}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DemoSandboxPage;
