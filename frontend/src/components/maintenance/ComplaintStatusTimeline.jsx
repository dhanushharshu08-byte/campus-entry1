import React from 'react';
import { CheckCircle2, Clock, UserCheck, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

const ComplaintStatusTimeline = ({ timeline = [], currentStatus = 'Submitted' }) => {
  const steps = [
    { key: 'Submitted', label: 'Submitted', icon: Clock },
    { key: 'Assigned', label: 'Assigned', icon: UserCheck },
    { key: 'In Progress', label: 'In Progress', icon: Wrench },
    { key: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
    { key: 'Closed', label: 'Closed', icon: ShieldCheck },
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Assigned': return 1;
      case 'In Progress': return 2;
      case 'Resolved': return 3;
      case 'Closed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="status-timeline-container">
      <h3 className="timeline-title">Audit Log & Timeline</h3>
      
      {/* Visual Stepper Bar */}
      <div className="stepper-bar">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className={`stepper-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="stepper-node">
                <StepIcon size={16} />
              </div>
              <span className="stepper-label">{step.label}</span>
              {idx < steps.length - 1 && <div className={`stepper-line ${idx < currentIndex ? 'filled' : ''}`} />}
            </div>
          );
        })}
      </div>

      {/* History Log Entries */}
      <div className="timeline-log-list">
        {timeline.length === 0 ? (
          <div className="timeline-empty">No status log entries recorded yet.</div>
        ) : (
          timeline.map((log) => (
            <div key={log.id} className="timeline-log-item">
              <div className="timeline-log-badge">{log.status || log.new_status}</div>
              <div className="timeline-log-details">
                <div className="log-header">
                  <span className="log-user">{log.changed_by_name || log.changed_by?.name || 'System'}</span>
                  <span className="log-time">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                  </span>
                </div>
                {log.comments && <div className="log-comments">{log.comments}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComplaintStatusTimeline;
