import React, { useState } from 'react';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Zap,
  Wrench,
  Wifi,
  Sparkles
} from 'lucide-react';

const ContactEmergencyPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'General Support',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="contact-emergency-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            24/7 Campus Dispatch
          </div>
          <h1 className="page-header-title">Campus Helpdesk &amp; Emergency Contacts</h1>
          <p className="page-header-subtitle">
            {COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.CAMPUS_NAME}
          </p>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Emergency Hotlines Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="card emergency-contact-card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>Campus Emergency Desk</h4>
                <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>24/7 Control Room</span>
              </div>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c', fontFamily: 'monospace' }}>
              {COLLEGE_CONFIG.COLLEGE_PHONE}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7f1d1d', marginTop: '0.35rem' }}>
              Immediate life-safety, fire alarm &amp; structural hazards
            </div>
          </div>

          <div className="card emergency-contact-card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', margin: 0 }}>Power &amp; Electrical Desk</h4>
                <span style={{ fontSize: '0.75rem', color: '#b45309' }}>Electrical Team</span>
              </div>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309', fontFamily: 'monospace' }}>
              {COLLEGE_CONFIG.COLLEGE_HELPLINE}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: '0.35rem' }}>
              Substation blackout, generator trip &amp; lab power failure
            </div>
          </div>

          <div className="card emergency-contact-card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#075985', margin: 0 }}>Plumbing &amp; Water Unit</h4>
                <span style={{ fontSize: '0.75rem', color: '#0369a1' }}>Water Supply Unit</span>
              </div>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>
              {COLLEGE_CONFIG.COLLEGE_PHONE} (x104)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#0c4a6e', marginTop: '0.35rem' }}>
              Restroom pipe rupture, cooler breakdown &amp; drainage
            </div>
          </div>
        </div>

        {/* Contact Info & Helpdesk Form Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Institutional Helpdesk Details */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '1.25rem' }}>
              Helpdesk Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>Campus Location</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.15rem' }}>
                    {COLLEGE_CONFIG.COLLEGE_NAME}<br />
                    {COLLEGE_CONFIG.COLLEGE_ADDRESS}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>Helpdesk Email</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.15rem' }}>
                    {COLLEGE_CONFIG.COLLEGE_EMAIL}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhoneCall size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>Telephone Helpline</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.15rem' }}>
                    {COLLEGE_CONFIG.COLLEGE_PHONE} / {COLLEGE_CONFIG.COLLEGE_HELPLINE}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>Operational Hours</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.15rem' }}>
                    Standard Maintenance: 8:00 AM – 6:00 PM<br />
                    Emergency Dispatch: 24 Hours / 7 Days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '1.25rem' }}>
              Send a General Inquiry
            </h3>

            {formSubmitted ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46', marginBottom: '0.25rem' }}>Inquiry Received</h4>
                <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0 }}>
                  Our campus administration desk will respond to your registered email address within 1 business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Campus Email *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. yourname@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Message / Inquiry *</label>
                  <textarea
                    required
                    rows={4}
                    className="form-textarea"
                    placeholder="Provide details about your query..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}>
                  <Send size={15} />
                  <span>Send Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactEmergencyPage;
