import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managementApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Clock, Eye, ShieldAlert } from 'lucide-react';

const ManagementOverdue = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdue = async () => {
      setLoading(true);
      try {
        const res = await managementApi.getOverdueComplaints();
        if (res.data?.success) {
          setComplaints(res.data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to load overdue complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverdue();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={24} color="#dc2626" />
            Overdue Grievance SLA Breach Queue
          </h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
            Active grievances that have exceeded the 48-hour resolution SLA deadline without completion.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
          Overdue Tickets: <strong style={{ color: '#dc2626' }}>{complaints.length}</strong>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint No</th>
                <th>Department</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Staff</th>
                <th>Created At</th>
                <th>Hours Overdue</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>
                        {c.complaint_number}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {c.department || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{c.location}</div>
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
                      <span style={{ fontSize: '0.825rem', color: c.assignee ? 'var(--color-slate-900)' : 'var(--color-slate-400)' }}>
                        {c.assignee?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-600)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangle size={12} />
                        +{c.hours_overdue} Hours Overdue
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/management/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                        <Eye size={13} />
                        <span>Inspect Ticket</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading overdue queue...' : 'Excellent! No active grievances have breached the 48-hour resolution SLA threshold.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagementOverdue;
