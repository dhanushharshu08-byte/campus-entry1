import React from 'react';
import { Building, AlertCircle } from 'lucide-react';

const DepartmentPerformance = ({ departments = [] }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} color="var(--color-brand-600)" />
            Department Performance & Workload Monitoring
          </h2>
          <p className="card-subtitle">Breakdown of grievance resolution metrics across active college departments</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th style={{ textAlign: 'center' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Submitted</th>
              <th style={{ textAlign: 'center' }}>Assigned</th>
              <th style={{ textAlign: 'center' }}>In Progress</th>
              <th style={{ textAlign: 'center' }}>Resolved</th>
              <th style={{ textAlign: 'center' }}>Closed</th>
              <th style={{ textAlign: 'center' }}>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {departments.length > 0 ? (
              departments.map((dept) => (
                <tr key={dept.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                    {dept.name}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{dept.total}</td>
                  <td style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>{dept.submitted}</td>
                  <td style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: 600 }}>{dept.assigned}</td>
                  <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{dept.in_progress}</td>
                  <td style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>{dept.resolved}</td>
                  <td style={{ textAlign: 'center', color: '#475569', fontWeight: 600 }}>{dept.closed}</td>
                  <td style={{ textAlign: 'center' }}>
                    {dept.overdue > 0 ? (
                      <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
                        {dept.overdue}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-slate-400)' }}>0</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-500)' }}>
                  No active department records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentPerformance;
