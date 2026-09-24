import React from 'react';
import { Link } from 'react-router-dom';
import CollegeBrandLogo from '../brand/CollegeBrandLogo';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck,
  Building
} from 'lucide-react';

const PublicFooter = () => {
  return (
    <footer className="public-footer-wrapper">
      {/* Top CTA Banner */}
      <div className="footer-cta-band">
        <div className="footer-cta-content">
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem', fontFamily: "'Outfit', sans-serif" }}>
              Experiencing a Campus Maintenance Issue?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Report issues directly with photo verification or track ticket resolution in real time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/complaints/new" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}>
              Report Issue Now
            </Link>
            <Link to="/track" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
              Track Ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="public-footer-main">
        <div className="footer-grid">
          {/* Col 1: Institutional Brand & Overview */}
          <div className="footer-col brand-col">
            <div style={{ marginBottom: '1rem' }}>
              <CollegeBrandLogo variant="compact" size={32} theme="dark" />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>
              Official Facilities Helpdesk &amp; Grievance Redressal System for {COLLEGE_CONFIG.COLLEGE_NAME}.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {COLLEGE_CONFIG.AFFILIATION}
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-link-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/facilities">Campus Facilities</Link></li>
              <li><Link to="/track">Track Grievance</Link></li>
              <li><Link to="/sla-policy">SLA Guidelines</Link></li>
              <li><Link to="/maintenance/login" style={{ color: '#fbbf24', fontWeight: 600 }}>Technician Login</Link></li>
              <li><Link to="/contact">Emergency Helpline</Link></li>
            </ul>
          </div>

          {/* Col 3: Maintenance Divisions */}
          <div className="footer-col">
            <h4 className="footer-heading">Maintenance Divisions</h4>
            <ul className="footer-link-list">
              <li><Link to="/facilities">Electrical Division</Link></li>
              <li><Link to="/facilities">Plumbing &amp; Water</Link></li>
              <li><Link to="/facilities">Civil &amp; Structural</Link></li>
              <li><Link to="/facilities">Carpentry Workshop</Link></li>
              <li><Link to="/facilities">Housekeeping &amp; Sanitation</Link></li>
              <li><Link to="/facilities">IT &amp; Campus Network</Link></li>
            </ul>
          </div>

          {/* Col 4: Campus Contact */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">Campus Contact</h4>
            <ul className="footer-contact-list">
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <MapPin size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{COLLEGE_CONFIG.COLLEGE_ADDRESS}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <PhoneCall size={16} color="#34d399" style={{ flexShrink: 0 }} />
                <span>{COLLEGE_CONFIG.COLLEGE_PHONE}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Mail size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
                <span>{COLLEGE_CONFIG.COLLEGE_EMAIL}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Clock size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span>Helpdesk: 24/7 Operations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            &copy; {new Date().getFullYear()} {COLLEGE_CONFIG.COLLEGE_NAME}. All rights reserved. &bull; {COLLEGE_CONFIG.PROJECT_NAME}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
            <Link to="/sla-policy" style={{ color: '#94a3b8' }}>SLA Policy</Link>
            <Link to="/contact" style={{ color: '#94a3b8' }}>Contact Helpdesk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
