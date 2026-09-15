import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  ArrowRight, 
  Sliders,
  Sparkles
} from 'lucide-react';

const SlaPolicyPage = () => {
  return (
    <div className="sla-policy-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag">Campus Standards</div>
          <h1 className="page-header-title">Institutional SLA Standards & Escalation Policy</h1>
          <p className="page-header-subtitle">
            Formal Service Level Agreements (SLAs), multi-tier escalation triggers, and administrative governance policies governing facilities management across college campus infrastructure.
          </p>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Section 1: SLA Target Matrix */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-slate-200)', marginBottom: '2rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                1. Priority Classification & Resolution Deadlines
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                Every grievance is assigned an initial SLA target upon submission based on priority severity.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-slate-50)', textAlign: 'left', fontSize: '0.82rem', color: 'var(--color-slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Priority Level</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Initial SLA Target</th>
                  <th style={{ padding: '0.85rem 1rem' }}>First Response Target</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Scope / Qualifying Scenarios</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                <tr style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span className="priority-badge priority-high" style={{ fontWeight: 700 }}>High Priority</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#dc2626' }}>
                    4 Hours
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)' }}>
                    &lt; 30 Minutes
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)', lineHeight: 1.5 }}>
                    Urgent campus disruptions, total power blackout, major water burst, lab safety hazards, server room HVAC failure.
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span className="priority-badge priority-medium" style={{ fontWeight: 700 }}>Medium Priority</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#d97706' }}>
                    24 Hours
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)' }}>
                    &lt; 2 Hours
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)', lineHeight: 1.5 }}>
                    Smart classroom projector/audio failure, single fixture tap leakage, corridor fan replacement, Wi-Fi coverage degradation.
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '1rem' }}>
                    <span className="priority-badge priority-low" style={{ fontWeight: 700 }}>Low Priority</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#059669' }}>
                    72 Hours
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)' }}>
                    &lt; 6 Hours
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--color-slate-600)', lineHeight: 1.5 }}>
                    Minor furniture alignment, non-urgent carpentry adjustments, cosmetic painting touchups, signage replacements.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: 3-Tier Escalation Framework */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-slate-200)', marginBottom: '2rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                2. Automated Multi-Tier Escalation Engine
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                CampuSentry executes a continuous background daemon thread evaluating active work orders against deadlines.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                  Tier 1
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b45309' }}>75% SLA Elapsed</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>
                Approaching SLA Warning
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5, margin: 0 }}>
                Dispatches a high-priority warning notification to the assigned technician indicating that 25% of target time remains.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  Tier 2
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#b91c1c' }}>100% SLA Exceeded</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.4rem' }}>
                Overdue & Breached Flag
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>
                Ticket is automatically marked overdue (`is_breached=True`), logged into the immutable audit trail, and highlighted red on dashboards.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                  Tier 3
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#7e22ce' }}>200% SLA Exceeded</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#6b21a8', marginBottom: '0.4rem' }}>
                Critical Management Escalation
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#581c87', lineHeight: 1.5, margin: 0 }}>
                High-priority alert dispatched directly to Executive Management desk for mandatory administrative intervention or workload reassignment.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Governance Policies */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-slate-200)', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                3. Quality Assurance & Re-opening Policy
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                Guarantees transparent resolution verification and user empowerment.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Photographic Resolution Proof:</strong> All maintenance staff must upload a clear photo of the repaired equipment/infrastructure before marking a ticket Resolved.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Complainant Sign-Off:</strong> Only the student or faculty member who reported the issue possesses the authorization to confirm final closure (`Closed` status).
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Reopening Authority:</strong> If an issue reoccurs or the resolution was unsatisfactory, the user can reopen the ticket back to `In Progress` with a mandatory reason note.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlaPolicyPage;
