import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Clock, 
  Users, 
  FileText, 
  Sliders, 
  Camera, 
  BarChart3, 
  Radio, 
  Lock, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  PlusCircle,
  Sparkles,
  Layers,
  Wrench,
  Search,
  Bell
} from 'lucide-react';

const FeaturesPage = () => {
  const coreFeatures = [
    {
      title: 'Automated Intelligent Dispatch',
      subtitle: 'Lowest-Load Round-Robin Routing',
      desc: 'New grievances are evaluated against active technician workloads in real-time. The system automatically assigns tasks to the technician with the fewest pending work orders.',
      icon: Zap,
      color: '#2563eb',
      bg: '#eff6ff',
      highlights: ['Prevents technician burnout', 'Zero manual dispatcher delays', 'Instant real-time room notification']
    },
    {
      title: '3-Tier SLA & Escalation Daemon',
      subtitle: 'Continuous Background Worker',
      desc: 'SLA engine continuously monitors ticket ages. Triggers Level 1 Approaching alerts (75%), Level 2 Breached flags (100%), and Level 3 Critical Management Escalations (200%).',
      icon: Clock,
      color: '#dc2626',
      bg: '#fef2f2',
      highlights: ['Priority targets (4h, 24h, 72h)', 'Anti-duplicate logging safeguards', 'Dynamic threshold reconfiguration']
    },
    {
      title: 'Granular Role-Based Access Control',
      subtitle: '4 Distinct Security Personas',
      desc: 'Strict authorization barriers for Students, Faculty, Technicians, and Management Administrators with protected routes and server-side RBAC decorators.',
      icon: Users,
      color: '#7c3aed',
      bg: '#f5f3ff',
      highlights: ['Student & faculty self-registration', 'Technician isolated work orders', 'Executive intervention privileges']
    },
    {
      title: 'Proof-of-Resolution Verification',
      subtitle: 'Mandatory Photographic Proof',
      desc: 'Technicians must upload an on-site photo demonstrating completed repairs alongside detailed work notes before moving a ticket to the Resolved state.',
      icon: Camera,
      color: '#059669',
      bg: '#ecfdf5',
      highlights: ['16MB secure image processing', 'Complainant sign-off verification', 'One-click complaint reopening']
    },
    {
      title: 'Immutable Security Audit Trail',
      subtitle: 'Enterprise Compliance Logging',
      desc: 'Every authentication event, ticket status change, reassignment, priority override, and system configuration is recorded with timestamp and IP address metadata.',
      icon: Lock,
      color: '#475569',
      bg: '#f8fafc',
      highlights: ['Cryptographic hash tracking', 'Filtered query interface', 'Non-repudiation and transparency']
    },
    {
      title: 'Dynamic CSV Reports & Analytics',
      subtitle: 'Instant Compliance Streaming',
      desc: 'Generate live compliance metrics and download streaming CSV exports for Complaints, Department Load, Staff Workload Index, and SLA Logs.',
      icon: Download,
      color: '#d97706',
      bg: '#fffbeb',
      highlights: ['One-click CSV downloads', 'Live resolution average charts', 'Time-to-first-response KPIs']
    },
    {
      title: 'Real-Time WebSocket Hub',
      subtitle: 'Flask-SocketIO Push Events',
      desc: 'Instant notifications, live status badge updates, and real-time dashboard counters without needing to refresh the browser page.',
      icon: Radio,
      color: '#0284c7',
      bg: '#f0f9ff',
      highlights: ['User-specific socket rooms', 'Management broadcast channel', 'Sub-second push delivery']
    },
    {
      title: 'Global Multi-Entity Search',
      subtitle: 'Cross-Table Instant Querying',
      desc: 'Search complaints by keyword, ticket ID, student name, department, or location with instant highlighted results.',
      icon: Search,
      color: '#ea580c',
      bg: '#fff7ed',
      highlights: ['Case-insensitive search', 'Instant keyboard navigation', 'Direct deep-linking to tickets']
    }
  ];

  return (
    <div className="features-page-container">
      {/* Hero Header */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag">System Capabilities</div>
          <h1 className="page-header-title">Enterprise Helpdesk & SLA Architecture</h1>
          <p className="page-header-subtitle">
            Explore the advanced technical features, automated dispatch algorithms, and compliance mechanisms powering CampuSentry.
          </p>
        </div>
      </div>

      {/* Grid of Capabilities */}
      <div className="section-wrapper">
        <div className="features-showcase-grid">
          {coreFeatures.map((feat, idx) => {
            const FeatIcon = feat.icon;
            return (
              <div key={idx} className="feature-detail-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box" style={{ backgroundColor: feat.bg, color: feat.color }}>
                    <FeatIcon size={22} />
                  </div>
                  <div>
                    <h3 className="feature-card-title">{feat.title}</h3>
                    <div className="feature-card-sub">{feat.subtitle}</div>
                  </div>
                </div>

                <p className="feature-card-desc">{feat.desc}</p>

                <div className="feature-highlights-box">
                  {feat.highlights.map((h, i) => (
                    <div key={i} className="highlight-item">
                      <CheckCircle2 size={14} color={feat.color} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Tech Architecture Stack */}
      <div className="section-wrapper tech-stack-section">
        <div className="section-header">
          <div className="section-tag">Technology Stack</div>
          <h2 className="section-title">Built with Production-Grade Engineering</h2>
          <p className="section-subtitle">
            Modern, maintainable, and high-performance stack designed for campus reliability.
          </p>
        </div>

        <div className="tech-stack-grid">
          <div className="tech-item-box">
            <div className="tech-item-category">Grievance Processing</div>
            <div className="tech-item-name">Intelligent Ticket Routing</div>
            <div className="tech-item-desc">Automatic workload balancing and specialist assignment across all 7 facilities departments.</div>
          </div>

          <div className="tech-item-box">
            <div className="tech-item-category">Real-time Push</div>
            <div className="tech-item-name">Instant Notifications</div>
            <div className="tech-item-desc">Live WebSocket updates on ticket assignment, repair progression, and resolution confirmation.</div>
          </div>

          <div className="tech-item-box">
            <div className="tech-item-category">Accessibility</div>
            <div className="tech-item-name">Universal Responsive Portal</div>
            <div className="tech-item-desc">Intuitive interface optimized for smartphones, tablets, and desktop workstations.</div>
          </div>

          <div className="tech-item-box">
            <div className="tech-item-category">Security & Trust</div>
            <div className="tech-item-name">Institutional Access Control</div>
            <div className="tech-item-desc">Cryptographic password hashing, granular role permissions, and immutable audit trails.</div>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
            <Sparkles size={16} />
            <span>Sign In to College Helpdesk</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
