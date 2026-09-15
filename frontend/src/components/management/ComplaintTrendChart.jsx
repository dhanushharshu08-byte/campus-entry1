import React from 'react';
import { TrendingUp } from 'lucide-react';

const ComplaintTrendChart = ({ trends = [] }) => {
  const maxVal = Math.max(...trends.map(t => t.complaints), 1);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--color-brand-600)" />
          Grievance Submission Trends (30 Days)
        </h3>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {trends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
            No trend data recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', paddingTop: '1rem', borderBottom: '1px solid var(--color-slate-200)' }}>
            {trends.map((t, idx) => {
              const heightPct = Math.max(8, Math.round((t.complaints / maxVal) * 100));
              const displayDate = t.date ? t.date.split('-').slice(1).join('/') : '';
              return (
                <div 
                  key={idx} 
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                  title={`${t.date}: ${t.complaints} complaints`}
                >
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '3px' }}>
                    {t.complaints > 0 ? t.complaints : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '18px',
                      height: `${heightPct}%`,
                      backgroundColor: t.complaints > 0 ? 'var(--color-brand-600)' : 'var(--color-slate-200)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-slate-400)', marginTop: '4px', transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
                    {idx % 3 === 0 ? displayDate : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintTrendChart;
