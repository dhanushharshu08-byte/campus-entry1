import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { Eye, ArrowRight, FileText } from 'lucide-react';

const RecentComplaints = ({ complaints = [] }) => {
  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--color-brand-600)" />
            Recent Grievance Submissions
          </h2>
          <p className="card-subtitle">Showing latest 10 grievance tickets across all college departments</p>
        </div>
        <Link to="/management/complaints" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>View All Complaints</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Complaint No</th>
              <th>Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Assigned To</th>
              <th>Submitted</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {safeComplaints.length > 0 ? (
              safeComplaints.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-brand-700)', fontSize: '0.85rem' }}>
                      {c.complaint_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                      {c.department || 'General'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                      {c.location}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.priority === 'High' ? '#dc2626' : c.priority === 'Medium' ? '#b45309' : '#475569' }}>
                      {c.priority}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-900)' }}>{c.creator?.name || c.created_by_name || 'User'}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)', textTransform: 'capitalize' }}>{c.creator?.role || c.created_by_role || ''}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', color: (c.assignee || c.assigned_to_name) ? 'var(--color-slate-900)' : 'var(--color-slate-400)' }}>
                      {c.assignee?.name || c.assigned_to_name || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : 'N/A'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/management/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                      <Eye size={13} />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-500)' }}>
                  No recent grievances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentComplaints;
