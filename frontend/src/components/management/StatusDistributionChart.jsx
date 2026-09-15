import React from 'react';
import { PieChart } from 'lucide-react';

const StatusDistributionChart = ({ stats }) => {
  const items = [
    { label: 'Submitted', value: stats?.submitted || 0, color: '#3b82f6' },
    { label: 'Assigned', value: stats?.assigned || 0, color: '#8b5cf6' },
    { label: 'In Progress', value: stats?.in_progress || 0, color: '#d97706' },
    { label: 'Resolved', value: stats?.resolved || 0, color: '#059669' },
    { label: 'Closed', value: stats?.closed || 0, color: '#475569' },
  ];

  const total = items.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={18} color="var(--color-brand-600)" />
          Complaint Status Distribution
        </h3>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
            No status data available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: '0.35rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span>{item.value} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: item.color,
                        transition: 'width 0.5s ease-in-out'
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

export default StatusDistributionChart;
