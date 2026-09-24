import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { complaintsApi } from '../../services/api';
import { 
  Search, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  MapPin, 
  Layers, 
  FileText, 
  ArrowRight,
  Camera,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

const TrackTicketPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ticketIdInput, setTicketIdInput] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTicket = async (idToSearch) => {
    if (!idToSearch || !idToSearch.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setComplaint(null);

    try {
      const res = await complaintsApi.track(idToSearch.trim());
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
      } else {
        setErrorMsg(res.data?.message || 'Ticket not found.');
      }
    } catch (err) {
      setErrorMsg(err.message || `No grievance ticket found matching '${idToSearch}'. Please check your Ticket ID.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setTicketIdInput(idFromUrl);
      fetchTicket(idFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticketIdInput.trim()) {
      setSearchParams({ id: ticketIdInput.trim() });
      fetchTicket(ticketIdInput.trim());
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Assigned': return 1;
      case 'In Progress': return 2;
      case 'Resolved': return 3;
      case 'Closed': return 4;
      default: return 0;
    }
  };

  const steps = [
    { title: 'Submitted', desc: 'Ticket logged by user' },
    { title: 'Assigned', desc: 'Routed to technician' },
    { title: 'In Progress', desc: 'Technician on-site' },
    { title: 'Resolved', desc: 'Proof uploaded' },
    { title: 'Closed', desc: 'Finalized by creator' }
  ];

  return (
    <div className="track-ticket-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag">Public Resolution Verification</div>
          <h1 className="page-header-title">Live Grievance Status & SLA Tracker</h1>
          <p className="page-header-subtitle">
            Track real-time progress, technician assignment, SLA compliance countdown, and resolution proof for any campus maintenance ticket.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: '560px', margin: '1.5rem auto 0' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                <input
                  type="text"
                  placeholder="Enter Ticket ID (e.g., CH-2026-0001 or 1)..."
                  value={ticketIdInput}
                  onChange={(e) => setTicketIdInput(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.75rem', borderRadius: '10px', fontSize: '0.95rem', height: '46px', backgroundColor: '#ffffff' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0 1.5rem', borderRadius: '10px', fontWeight: 600 }}
              >
                {loading ? 'Searching...' : 'Track Ticket'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: '12px', padding: '1rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Lookup Error:</strong> {errorMsg}
            </div>
          </div>
        )}

        {complaint && (
          <div className="card public-tracking-result-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: '2rem', border: '1px solid var(--color-slate-200)', backgroundColor: '#ffffff' }}>
            {/* Top Bar with ID and Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-slate-100)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span className="ticket-id-tag" style={{ fontSize: '0.9rem', padding: '0.25rem 0.65rem' }}>
                    {complaint.complaint_number}
                  </span>
                  <span className={`priority-badge priority-${complaint.priority.toLowerCase()}`}>
                    {complaint.priority} Priority ({complaint.sla_target_hours}h SLA)
                  </span>
                  {complaint.is_breached ? (
                    <span className="sla-breached" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                      ⚠️ SLA Breached
                    </span>
                  ) : (
                    <span className="sla-normal" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                      ✅ On Track
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: '0.25rem 0' }}>
                  {complaint.title}
                </h2>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--color-slate-500)', marginTop: '0.4rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Layers size={14} />
                    <span>{complaint.department}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} />
                    <span>{complaint.location}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} />
                    <span>Logged on: {new Date(complaint.created_at).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <span className={`status-pill status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.9rem', padding: '0.45rem 1rem' }}>
                {complaint.status}
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div style={{ margin: '2rem 0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>
                Resolution Stage Timeline
              </h4>

              <div className="stepper-horizontal">
                {steps.map((step, idx) => {
                  const currentIdx = getStatusStepIndex(complaint.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={idx} className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="stepper-circle">
                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <div className="stepper-label">{step.title}</div>
                      <div className="stepper-sublabel">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description & Details */}
            <div style={{ backgroundColor: 'var(--color-slate-50)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Issue Description
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-800)', lineHeight: 1.6, margin: 0 }}>
                {complaint.description}
              </p>
            </div>

            {/* Resolution Section if available */}
            {complaint.resolution_remarks && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Technician Resolution Report</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#065f46', margin: 0, lineHeight: 1.5 }}>
                  {complaint.resolution_remarks}
                </p>
                {complaint.resolved_at && (
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.5rem' }}>
                    Completed on: {new Date(complaint.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Public Status Transition Logs */}
            {complaint.status_logs && complaint.status_logs.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
                  Public Status Log History
                </h4>
                <div className="status-history-list">
                  {complaint.status_logs.map((log) => (
                    <div key={log.id} className="history-item">
                      <div className="history-dot" />
                      <div className="history-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-slate-900)' }}>
                            Status updated to &ldquo;{log.new_status}&rdquo;
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        {log.comments && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)', marginTop: '0.25rem' }}>
                            {log.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Action to Login for Management/Closure */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={15} color="#2563eb" />
                <span>Are you the ticket creator or maintenance technician?</span>
              </div>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Log In to Manage Ticket</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {!complaint && !loading && !errorMsg && (
          <div className="card empty-track-state" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: '16px', border: '1px dashed var(--color-slate-300)', backgroundColor: '#ffffff' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Search size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
              Track Any Campus Grievance
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-500)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Enter a valid Ticket ID such as <strong>CH-2026-0001</strong> above to look up its live assignment, resolution proof, and SLA status.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/complaints/new" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Report New Issue
              </Link>
              <Link to="/demo" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Test Demo Accounts
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackTicketPage;
