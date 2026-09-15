import React from 'react';
import { Activity, Clock, Wrench, CheckCircle2, AlertCircle, ShieldCheck, User } from 'lucide-react';

const LiveActivity = ({ activities = [] }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Progress':
        return <Wrench size={14} color="#d97706" />;
      case 'Resolved':
        return <CheckCircle2 size={14} color="#059669" />;
      case 'Closed':
        return <ShieldCheck size={14} color="#475569" />;
      case 'Assigned':
        return <User size={14} color="#8b5cf6" />;
      default:
        return <Activity size={14} color="#3b82f6" />;
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--color-brand-600)" />
          Live Operations Activity Feed
        </h3>
      </div>

      <div style={{ padding: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
            No recent activity recorded yet.
          </div>
        ) : (
          <div className="live-activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.slice(0, 20).map((act, idx) => {
              const timeStr = act.timestamp
                ? new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                : 'Just now';

              return (
                <div 
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-slate-50)',
                    border: '1px solid var(--color-slate-200)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getStatusIcon(act.new_status)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-brand-700)' }}>
                        {act.complaint_number || 'TICKET'}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-400)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} />
                        {timeStr}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-900)', fontWeight: 500 }}>
                      Status changed to <strong style={{ color: 'var(--color-slate-900)' }}>{act.new_status}</strong>
                    </div>

                    {act.comments && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.15rem' }}>
                        {act.comments}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivity;
