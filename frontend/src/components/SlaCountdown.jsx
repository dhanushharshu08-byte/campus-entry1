import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const SlaCountdown = ({ complaint, showDetails = true }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (!complaint || !complaint.sla_deadline) {
    return null;
  }

  const deadline = new Date(complaint.sla_deadline);
  const isCompleted = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const resolvedAt = complaint.resolved_at ? new Date(complaint.resolved_at) : null;
  
  // For completed tickets, check if resolved within SLA
  if (isCompleted) {
    const metSla = resolvedAt ? resolvedAt <= deadline : (complaint.resolved_within_sla ?? true);
    return (
      <div className={`sla-badge-container ${metSla ? 'sla-met' : 'sla-breached'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {metSla ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#dc2626" />}
          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
            {metSla ? 'Resolved within SLA' : 'Resolved after SLA deadline'}
          </span>
        </div>
        {complaint.resolution_time_minutes !== null && complaint.resolution_time_minutes !== undefined && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.2rem' }}>
            Resolution time: {complaint.resolution_time_minutes < 60 ? `${Math.round(complaint.resolution_time_minutes)} mins` : `${(complaint.resolution_time_minutes / 60).toFixed(1)} hrs`}
          </div>
        )}
      </div>
    );
  }

  // Active tickets: compute remaining / overdue time
  const diffMs = deadline.getTime() - now.getTime();
  const isOverdue = diffMs < 0 || complaint.is_overdue;
  const absDiffSecs = Math.abs(Math.floor(diffMs / 1000));
  
  const hours = Math.floor(absDiffSecs / 3600);
  const minutes = Math.floor((absDiffSecs % 3600) / 60);

  const formattedDeadline = deadline.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const escalationLevel = complaint.escalation_level || 0;

  const getEscalationBadge = () => {
    if (escalationLevel === 3) {
      return (
        <span className="badge-escalation level-3">
          <ShieldAlert size={12} /> CRITICAL ESCALATION
        </span>
      );
    }
    if (escalationLevel === 2 || isOverdue) {
      return (
        <span className="badge-escalation level-2">
          <AlertCircle size={12} /> SLA BREACHED
        </span>
      );
    }
    if (escalationLevel === 1) {
      return (
        <span className="badge-escalation level-1">
          <AlertTriangle size={12} /> APPROACHING SLA
        </span>
      );
    }
    return (
      <span className="badge-escalation level-0">
        <Clock size={12} /> ON TRACK
      </span>
    );
  };

  return (
    <div className={`sla-box ${isOverdue ? 'overdue' : escalationLevel === 1 ? 'warning' : 'normal'}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Clock size={14} />
          <span>SLA Deadline</span>
        </div>
        {getEscalationBadge()}
      </div>

      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-slate-800)', marginBottom: '0.35rem' }}>
        {formattedDeadline}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
          {isOverdue ? 'Overdue by:' : 'Time Remaining:'}
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color: isOverdue ? '#dc2626' : escalationLevel === 1 ? '#d97706' : '#16a34a'
          }}
        >
          {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m
        </span>
      </div>
    </div>
  );
};

export default SlaCountdown;
