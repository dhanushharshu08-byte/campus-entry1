import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export const StatusBadge = ({ status, size = 'normal' }) => {
  const norm = (status || '').toLowerCase().replace(/[\s_-]+/g, '');

  let badgeClass = 'badge-submitted';
  let Icon = Clock;

  switch (norm) {
    case 'submitted':
      badgeClass = 'badge-submitted';
      Icon = Clock;
      break;
    case 'assigned':
      badgeClass = 'badge-assigned';
      Icon = Sparkles;
      break;
    case 'inprogress':
      badgeClass = 'badge-in_progress';
      Icon = Clock;
      break;
    case 'resolved':
      badgeClass = 'badge-resolved';
      Icon = CheckCircle2;
      break;
    case 'closed':
      badgeClass = 'badge-closed';
      Icon = CheckCircle2;
      break;
    case 'reopened':
      badgeClass = 'badge-reopened';
      Icon = AlertTriangle;
      break;
    default:
      badgeClass = 'badge-submitted';
      Icon = Clock;
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'badge-sm' : ''}`}>
      <Icon size={size === 'sm' ? 11 : 13} />
      <span>{status || 'Submitted'}</span>
    </span>
  );
};

export const PriorityBadge = ({ priority, size = 'normal' }) => {
  const norm = (priority || '').toLowerCase();
  let badgeClass = 'priority-medium prio-medium';
  let Icon = Clock;

  if (norm === 'high' || norm === 'urgent' || norm === 'critical') {
    badgeClass = 'priority-high prio-high';
    Icon = AlertTriangle;
  } else if (norm === 'low') {
    badgeClass = 'priority-low prio-low';
    Icon = Clock;
  } else {
    badgeClass = 'priority-medium prio-medium';
    Icon = Clock;
  }

  return (
    <span className={`priority-badge prio-badge ${badgeClass} ${size === 'sm' ? 'badge-sm prio-sm' : ''}`}>
      <Icon size={size === 'sm' ? 11 : 13} />
      <span>{priority || 'Medium'}</span>
    </span>
  );
};

export const EscalationBadge = ({ level, isOverdue }) => {
  if (level === 3) {
    return (
      <span className="badge-escalation level-3" title="Exceeded 2x SLA Duration">
        <ShieldAlert size={12} /> Critical Escalation
      </span>
    );
  }
  if (level === 2 || isOverdue) {
    return (
      <span className="badge-escalation level-2" title="SLA Deadline Breached">
        <AlertTriangle size={12} /> Overdue
      </span>
    );
  }
  if (level === 1) {
    return (
      <span className="badge-escalation level-1" title="Remaining time <= 25%">
        <Clock size={12} /> Approaching SLA
      </span>
    );
  }
  return null;
};

export default StatusBadge;
