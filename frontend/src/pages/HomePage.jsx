import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { CampuSentryShield } from '../components/brand/CollegeBrandLogo';
import { 
  Shield, 
  PlusCircle, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Zap, 
  Building2, 
  Wifi, 
  GraduationCap, 
  School, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  PhoneCall, 
  HelpCircle,
  TrendingUp,
  Layers,
  ChevronDown,
  Lock,
  UserCheck,
  CheckCircle,
  FileText,
  Camera,
  MapPin
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  // Quick Ticket Tracking State
  const [quickTrackId, setQuickTrackId] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [trackError, setTrackError] = useState('');

  // Active Role Tab for Quick Demo Access
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [launchingRole, setLaunchingRole] = useState(null);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  const handleQuickTrack = async (e) => {
    e?.preventDefault();
    if (!quickTrackId.trim()) return;
    setTrackingLoading(true);
    setTrackError('');
    setTrackedTicket(null);

    try {
      const res = await axios.get(`/api/complaints/track/${encodeURIComponent(quickTrackId.trim())}`);
      if (res.data && res.data.success) {
        setTrackedTicket(res.data.complaint);
      } else {
        setTrackError(res.data.message || 'Ticket not found.');
      }
    } catch (err) {
      setTrackError(err?.response?.data?.message || `No grievance found matching '${quickTrackId}'. Please verify your ticket ID.`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleRoleQuickLaunch = async (email, password, role) => {
    setLaunchingRole(role);
    try {
      const res = await login(email, password);
      if (res && res.success) {
        navigate(getDashboardRoute(res.user?.role || role));
      }
    } catch (err) {
      console.error('Quick launch failed:', err);
    } finally {
      setLaunchingRole(null);
    }
  };

  const roleDetails = {
    student: {
      title: 'Student Redressal Portal',
      badge: 'Hostels, Classrooms & Campus Grounds',
      icon: GraduationCap,
      color: '#059669',
      bg: '#ecfdf5',
      demoEmail: 'student@acetcbe.edu.in',
      demoPass: 'Student@123',
      description: 'Report classroom, hostel, lab, and campus facility problems with photo evidence and location details. Track repair stages with live status updates.',
      features: [
        'Instant grievance logging with problem photo upload',
        'Automatic department queue assignment',
        'Real-time status updates from technician',
        'Resolution photo verification and final sign-off'
      ]
    },
    faculty: {
      title: 'Faculty Priority Portal',
      badge: 'Academic Labs, Dept Offices & Lecture Halls',
      icon: School,
      color: '#7c3aed',
      bg: '#f5f3ff',
      demoEmail: 'faculty@acetcbe.edu.in',
      demoPass: 'Faculty@123',
      description: 'Priority reporting for department infrastructure, smart classrooms, research lab equipment, and audio-visual facilities across campus blocks.',
      features: [
        'Direct reporting for departmental laboratories & classrooms',
        'Automated routing to domain technicians',
        'Real-time notification on technician acceptance & progress',
        'Historical maintenance log for departmental auditing'
      ]
    },
    maintenance: {
      title: 'Maintenance Operations Desk',
      badge: 'Central Maintenance Helpdesk',
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
      demoEmail: 'maintenance@college.edu',
      demoPass: 'Tech@123',
      description: 'Centralized helpdesk queue across all college maintenance divisions (Electrical, Plumbing, Civil, Carpentry, Cleaning, IT / Network).',
      features: [
        'Unified job queue across all 7 maintenance departments',
        'One-click work acceptance and status progression (In Progress ➔ Resolved)',
        'Upload after-repair fixed condition photo proof',
        'Detailed resolution remarks and repair logging'
      ]
    },
    management: {
      title: 'Campus Operations Overview',
      badge: 'Executive Oversight & Compliance',
      icon: Shield,
      color: '#2563eb',
      bg: '#eff6ff',
      demoEmail: 'admin@college.edu',
      demoPass: 'Admin@123',
      description: 'Comprehensive college estate management, live department resolution metrics, staff workload tracking, and CSV analytics exports.',
      features: [
        'Real-time campus maintenance overview & ticket metrics',
        'Department-wise resolution statistics from live database',
        'Maintenance staff roster & department management',
        'One-click streaming CSV exports for institutional records'
      ]
    }
  };

  const faqs = [
    {
      q: 'How does automatic department assignment work in CampuSentry?',
      a: 'When you submit a complaint and select the category (e.g., Electrical, Plumbing, IT / Network), CampuSentry automatically routes the request directly to the appropriate maintenance department queue without requiring manual routing.'
    },
    {
      q: 'How do real-time notifications work?',
      a: 'CampuSentry utilizes real-time communication via Socket.IO. When a complaint is created, maintenance receives an instant alert. When maintenance accepts the ticket or completes the repair, you receive an immediate update without refreshing the page.'
    },
    {
      q: 'Can I track a complaint without signing in?',
      a: 'Yes! Simply enter your Complaint ID (e.g., CH-2026-00001) in the Quick Ticket Tracker on this page to view its live status, assigned department, and resolution remarks.'
    },
    {
      q: 'What verification is required before a complaint is marked resolved?',
      a: 'Maintenance technicians must provide specific resolution remarks and upload a photograph demonstrating the completed repair before marking the issue resolved.'
    },
    {
      q: 'What should I do in case of an urgent campus emergency?',
      a: 'For urgent safety hazards such as major water pipe bursts, power blackouts during exams, or structural hazards, contact the 24/7 Campus Emergency Desk immediately at +91 4259 200300.'
    }
  ];

  return (
    <div className="website-homepage">
      {/* 1. HERO SECTION */}
      <section className="home-hero-section">
        <div className="hero-glow-orb hero-glow-1" />
        <div className="hero-glow-orb hero-glow-2" />

        <div className="home-hero-container">
          {/* Institutional Badge */}
          <div className="hero-badge">
            <span className="badge-pulse-dot" />
            <CampuSentryShield size={16} />
            <span>{COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.CAMPUS_NAME}</span>
          </div>

          <h1 className="hero-title">
            CampuSentry <br />
            <span className="hero-gradient-text">{COLLEGE_CONFIG.PROJECT_TAGLINE}</span>
          </h1>

          <p className="hero-subtitle">
            {COLLEGE_CONFIG.HERO_SUBTITLE}
          </p>

          {/* Quick Ticket Tracker Search */}
          <div className="hero-search-box">
            <form onSubmit={handleQuickTrack} className="hero-search-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Enter Complaint ID (e.g. CH-2026-00001 or 1)..."
                  value={quickTrackId}
                  onChange={(e) => setQuickTrackId(e.target.value)}
                  className="hero-search-input"
                  aria-label="Complaint ID"
                />
              </div>
              <button 
                type="submit" 
                disabled={trackingLoading}
                className="btn btn-primary hero-search-btn"
              >
                {trackingLoading ? 'Checking...' : 'Track Ticket'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Inline Track Result */}
          {trackedTicket && (
            <div className="hero-track-result-card">
              <div className="result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="ticket-id-tag">{trackedTicket.complaint_number}</span>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                    {trackedTicket.title}
                  </h4>
                </div>
                <span className={`status-pill status-${trackedTicket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {trackedTicket.status}
                </span>
              </div>

              <div className="result-meta-grid">
                <div>
                  <span className="meta-label">Department:</span>
                  <span className="meta-value">{trackedTicket.department}</span>
                </div>
                <div>
                  <span className="meta-label">Location:</span>
                  <span className="meta-value">{trackedTicket.location}</span>
                </div>
                <div>
                  <span className="meta-label">Priority:</span>
                  <span className="meta-value" style={{ textTransform: 'capitalize' }}>
                    {trackedTicket.priority} Priority
                  </span>
                </div>
                <div>
                  <span className="meta-label">Status Stage:</span>
                  <span className="meta-value" style={{ fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    {trackedTicket.status}
                  </span>
                </div>
              </div>

              {trackedTicket.resolution_remarks && (
                <div className="result-remarks-box">
                  <strong>Resolution Remarks:</strong> {trackedTicket.resolution_remarks}
                </div>
              )}

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/track?id=${trackedTicket.complaint_number}`} className="link-arrow">
                  <span>View Complete Public Timeline</span>
                  <ArrowRight size={14} />
                </Link>
                <button 
                  type="button" 
                  onClick={() => setTrackedTicket(null)} 
                  className="btn btn-ghost" 
                  style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {trackError && (
            <div className="hero-track-error">
              <AlertTriangle size={16} />
              <span>{trackError}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="hero-actions-group">
            <Link to={isAuthenticated ? "/complaints/new" : "/login"} className="btn btn-primary hero-btn-main">
              <PlusCircle size={18} />
              <span>Report an Issue</span>
            </Link>

            <Link to={isAuthenticated ? getDashboardRoute(user?.role) : "/login"} className="btn btn-secondary hero-btn-demo">
              <Lock size={16} />
              <span>{isAuthenticated ? 'Open Dashboard' : 'Sign In'}</span>
            </Link>

            <Link to="/facilities" className="btn btn-ghost hero-btn-facilities">
              <span>View Maintenance Departments</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VISUAL WORKFLOW: REPORT -> ASSIGN -> RESOLVE -> MONITOR */}
      <section className="section-wrapper" style={{ paddingBottom: '2.5rem' }}>
        <div className="section-header">
          <div className="section-tag" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderColor: '#bfdbfe' }}>
            <Clock size={14} />
            <span>Standard Operating Procedure</span>
          </div>
          <h2 className="section-title">Transparent 4-Step Resolution Cycle</h2>
          <p className="section-subtitle">
            From the moment a problem is reported until repair verification, every ticket follows a structured, accountable lifecycle.
          </p>
        </div>

        <div className="pipeline-steps-grid">
          {[
            { 
              step: '01', 
              title: 'Report', 
              subtitle: 'Submit Grievance', 
              desc: 'Student or faculty reports problem with building location, floor, room number, and photo proof.', 
              icon: PlusCircle,
              color: '#2563eb',
              bg: '#eff6ff'
            },
            { 
              step: '02', 
              title: 'Assign', 
              subtitle: 'Automatic Dispatch', 
              desc: 'Request is instantly assigned to the matching maintenance department queue with real-time technician alerts.', 
              icon: Layers,
              color: '#7c3aed',
              bg: '#f5f3ff'
            },
            { 
              step: '03', 
              title: 'Resolve', 
              subtitle: 'Work & Proof Upload', 
              desc: 'Technician accepts the task, performs physical repair, uploads fixed-condition photo, and adds remarks.', 
              icon: Wrench,
              color: '#d97706',
              bg: '#fffbeb'
            },
            { 
              step: '04', 
              title: 'Monitor', 
              subtitle: 'Verification & Audit', 
              desc: 'Complainant verifies resolution and confirms closure. Campus management audits resolution performance.', 
              icon: CheckCircle2,
              color: '#059669',
              bg: '#ecfdf5'
            }
          ].map((item, idx) => {
            const StepIcon = item.icon;
            return (
              <div key={idx} className="pipeline-step-card" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div className="step-icon-box" style={{ backgroundColor: item.bg, color: item.color }}>
                    <StepIcon size={20} />
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-300)', fontFamily: "'Outfit', sans-serif" }}>
                    {item.step}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.subtitle}
                </div>
                <h3 className="step-title" style={{ marginTop: '0.2rem' }}>{item.title}</h3>
                <p className="step-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. MAINTENANCE DEPARTMENTS */}
      <section className="section-wrapper facilities-grid-section">
        <div className="section-header">
          <div className="section-tag">Campus Facilities</div>
          <h2 className="section-title">7 Specialized Maintenance Divisions</h2>
          <p className="section-subtitle">
            Dedicated campus maintenance teams across {COLLEGE_CONFIG.COLLEGE_NAME} infrastructure.
          </p>
        </div>

        <div className="facilities-cards-grid">
          {[
            {
              name: 'Electrical',
              code: 'ELEC',
              desc: 'Substations, lighting, classroom switchboards, lab electrical points, ceiling fans, and wiring.',
              icon: Zap,
              color: '#eab308',
              bg: '#fefce8'
            },
            {
              name: 'Plumbing',
              code: 'PLUMB',
              desc: 'Restrooms, drinking water coolers, pipeline leaks, drainage, pumps, and water tank systems.',
              icon: Wrench,
              color: '#0284c7',
              bg: '#f0f9ff'
            },
            {
              name: 'Civil',
              code: 'CIVIL',
              desc: 'Masonry, wall plastering, roof waterproofing, doors, window fittings, and structural maintenance.',
              icon: Building2,
              color: '#ea580c',
              bg: '#fff7ed'
            },
            {
              name: 'Carpentry',
              code: 'CARP',
              desc: 'Lecture hall benches, faculty desks, auditorium seats, laboratory tables, and door locks.',
              icon: Layers,
              color: '#b45309',
              bg: '#fffbeb'
            },
            {
              name: 'Cleaning & Housekeeping',
              code: 'CLEAN',
              desc: 'Classroom cleanliness, washroom hygiene, corridor sanitization, and waste disposal management.',
              icon: Sparkles,
              color: '#10b981',
              bg: '#ecfdf5'
            },
            {
              name: 'IT / Network',
              code: 'ITNET',
              desc: 'Campus Wi-Fi APs, computer lab LAN, classroom smart projectors, and network points.',
              icon: Wifi,
              color: '#8b5cf6',
              bg: '#f5f3ff'
            },
            {
              name: 'Other Facilities',
              code: 'OTHER',
              desc: 'General campus utilities, sports grounds, perimeter lighting, signage, and misc infrastructure.',
              icon: HelpCircle,
              color: '#64748b',
              bg: '#f1f5f9'
            }
          ].map((fac, idx) => {
            const FacIcon = fac.icon;
            return (
              <div key={idx} className="facility-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div className="facility-icon-box" style={{ backgroundColor: fac.bg, color: fac.color }}>
                    <FacIcon size={20} />
                  </div>
                  <span className="facility-sla-tag" style={{ color: fac.color, borderColor: fac.bg }}>
                    {fac.code}
                  </span>
                </div>

                <h3 className="facility-title">{fac.name}</h3>
                <p className="facility-desc">{fac.desc}</p>

                <div className="facility-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    {COLLEGE_CONFIG.CAMPUS_NAME}
                  </span>
                  <Link 
                    to={isAuthenticated ? "/complaints/new" : "/login"} 
                    className="facility-report-link"
                    style={{ color: fac.color }}
                  >
                    <span>Report Issue</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ROLE WORKFLOW SHOWCASE & 1-CLICK ACCESS */}
      <section className="section-wrapper role-sandbox-section">
        <div className="section-header">
          <div className="section-tag">Role Portals</div>
          <h2 className="section-title">Dedicated Workspaces for Every Campus Member</h2>
          <p className="section-subtitle">
            CampuSentry provides tailored portals designed specifically for students, faculty, maintenance staff, and campus administration.
          </p>
        </div>

        <div className="role-tabs-wrapper">
          {Object.keys(roleDetails).map((key) => {
            const role = roleDetails[key];
            const Icon = role.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveRoleTab(key)}
                className={`role-tab-btn ${activeRoleTab === key ? 'active' : ''}`}
                style={{
                  borderColor: activeRoleTab === key ? role.color : 'transparent',
                  background: activeRoleTab === key ? '#ffffff' : 'transparent',
                }}
              >
                <div 
                  className="role-tab-icon" 
                  style={{ 
                    backgroundColor: role.bg, 
                    color: role.color 
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="role-tab-name">{role.title.split(' ')[0]}</div>
                  <div className="role-tab-sub">{role.badge.split(',')[0]}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Content Card */}
        {(() => {
          const current = roleDetails[activeRoleTab];
          const CurrentIcon = current.icon;
          const isLaunching = launchingRole === activeRoleTab;

          return (
            <div className="role-display-card">
              <div className="role-display-left">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: current.bg, color: current.color, padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                  <CurrentIcon size={16} />
                  <span>{current.badge}</span>
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.85rem' }}>
                  {current.title}
                </h3>

                <p style={{ fontSize: '0.95rem', color: 'var(--color-slate-600)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {current.description}
                </p>

                <div className="role-feature-list">
                  {current.features.map((feat, i) => (
                    <div key={i} className="role-feature-item">
                      <CheckCircle2 size={16} color={current.color} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="role-action-bar">
                  <button
                    type="button"
                    onClick={() => handleRoleQuickLaunch(current.demoEmail, current.demoPass, activeRoleTab)}
                    disabled={isLaunching}
                    className="btn btn-primary"
                    style={{
                      backgroundColor: current.color,
                      borderColor: current.color,
                      padding: '0.75rem 1.5rem',
                      fontWeight: 600
                    }}
                  >
                    {isLaunching ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>1-Click Sign In as {current.title.split(' ')[0]}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="role-demo-credentials">
                    <span style={{ fontWeight: 600 }}>Login:</span> {current.demoEmail} &bull; {current.demoPass}
                  </div>
                </div>
              </div>

              <div className="role-display-right">
                <div className="role-mockup-panel">
                  <div className="mockup-header">
                    <div className="mockup-dots">
                      <span className="dot dot-red" />
                      <span className="dot dot-yellow" />
                      <span className="dot dot-green" />
                    </div>
                    <span className="mockup-title">{COLLEGE_CONFIG.PROJECT_NAME} // {current.title}</span>
                  </div>

                  <div className="mockup-body">
                    {activeRoleTab === 'student' && (
                      <div className="mockup-content-box">
                        <div className="mockup-ticket-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span className="badge-mockup blue">CH-2026-00001</span>
                            <span className="badge-mockup warning">In Progress</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Hostel Block A - Room 204 Fan Issue</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Department: Electrical &bull; Technician Accepted</div>
                        </div>

                        <div className="mockup-ticket-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span className="badge-mockup blue">CH-2026-00002</span>
                            <span className="badge-mockup success">Resolved</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Central Library - Wi-Fi AP Offline</div>
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>Resolution photo uploaded &bull; Ready for sign-off</div>
                        </div>
                      </div>
                    )}

                    {activeRoleTab === 'faculty' && (
                      <div className="mockup-content-box">
                        <div className="mockup-ticket-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span className="badge-mockup purple">High Priority</span>
                            <span className="badge-mockup warning">In Progress</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>CS &amp; IT Block - Lab 3 Projector Display Issue</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Department: IT / Network &bull; Technician On Site</div>
                        </div>
                      </div>
                    )}

                    {activeRoleTab === 'maintenance' && (
                      <div className="mockup-content-box">
                        <div className="mockup-ticket-item">
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>Mechanical Block - Restroom Tap Leakage</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Department: Plumbing &bull; Location: 2nd Floor East Wing</div>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                            <span className="btn-mockup primary">Upload Fixed Image</span>
                            <span className="btn-mockup">Add Remarks</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeRoleTab === 'management' && (
                      <div className="mockup-content-box">
                        <div className="mockup-ticket-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Campus Operations Overview</span>
                            <span className="badge-mockup blue">Live</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                            Real-time database analytics &bull; 1-Click CSV export &bull; Staff roster oversight
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 5. CAMPUS EMERGENCY & CONTACT HELPLINE */}
      <section className="emergency-hotline-band">
        <div className="emergency-band-inner">
          <div className="emergency-info">
            <div className="emergency-icon-glow">
              <PhoneCall size={24} color="#dc2626" />
            </div>
            <div>
              <div className="emergency-tag">{COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Campus Facilities Desk</div>
              <h3 className="emergency-title">Campus Maintenance &amp; Emergency Support</h3>
              <p className="emergency-subtitle">
                {COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.COLLEGE_ADDRESS}
              </p>
            </div>
          </div>

          <div className="emergency-cta-box">
            <div className="emergency-phone-number">{COLLEGE_CONFIG.COLLEGE_PHONE}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)', marginTop: '0.25rem' }}>
              Email: {COLLEGE_CONFIG.COLLEGE_EMAIL}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="section-wrapper faq-section">
        <div className="section-header">
          <div className="section-tag">Campus Guidelines</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Helpful answers regarding campus issue reporting, technician workflows, and resolution verification.
          </p>
        </div>

        <div className="faq-accordion-wrapper">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="faq-question-btn"
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.q}</span>
                  <ChevronDown size={18} className={`faq-arrow ${isOpen ? 'rotated' : ''}`} />
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="section-wrapper home-bottom-cta">
        <div className="bottom-cta-card">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            {COLLEGE_CONFIG.COLLEGE_NAME}
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: '650px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            Report an infrastructure issue in seconds or sign in to manage campus facilities requests.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={isAuthenticated ? "/complaints/new" : "/login"} className="btn btn-primary" style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem', fontWeight: 600 }}>
              <PlusCircle size={18} />
              <span>Report an Issue</span>
            </Link>
            <Link 
              to={isAuthenticated ? getDashboardRoute(user?.role) : "/login"}
              className="btn btn-secondary" 
              style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign In'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
