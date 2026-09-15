import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';

const StaffWorkloadChart = ({ staff = [] }) => {
  const maxActive = Math.max(...staff.map(s => s.active_complaints), 1);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--color-brand-600)" />
          Maintenance Staff Workload
        </h3>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {staff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
            No active maintenance staff members registered.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {staff.map((member) => {
              const pct = Math.round((member.active_complaints / maxActive) * 100);
              const isOverloaded = member.active_complaints >= 5;

              return (
                <div key={member.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {member.name} ({member.department})
                    </span>
                    <span style={{ fontWeight: 700, color: isOverloaded ? '#dc2626' : 'var(--color-brand-700)' }}>
                      {member.active_complaints} Active Ticket{member.active_complaints !== 1 ? 's' : ''}
                      {member.overdue > 0 && ` (${member.overdue} Overdue)`}
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(5, pct)}%`,
                        backgroundColor: isOverloaded ? '#dc2626' : 'var(--color-brand-600)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
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

export default StaffWorkloadChart;
