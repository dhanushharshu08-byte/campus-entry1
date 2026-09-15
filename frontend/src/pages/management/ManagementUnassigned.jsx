import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managementApi } from '../../services/api';
import { UserX, Clock, Eye, AlertTriangle } from 'lucide-react';

const ManagementUnassigned = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnassigned = async () => {
      setLoading(true);
      try {
        const res = await managementApi.getUnassignedComplaints();
        if (res.data?.success) {
          setComplaints(res.data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to load unassigned complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnassigned();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserX size={24} color="#ea580c" />
            Unassigned Grievance Queue
          </h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
            Grievances submitted to the helpdesk where no active maintenance staff was available for automatic assignment.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
          Unassigned Count: <strong style={{ color: '#ea580c' }}>{complaints.length}</strong>
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
                <th>Submitted Date</th>
                <th>Unassigned Age</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => {
                  const isOld = c.age_hours >= 24;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-brand-700)', fontSize: '0.85rem' }}>
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
                        <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: isOld ? '#fef2f2' : '#fff7ed', color: isOld ? '#dc2626' : '#c2410c', border: `1px solid ${isOld ? '#fecaca' : '#ffedd5'}`, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {isOld && <AlertTriangle size={12} />}
                          {c.age_hours} Hours Unassigned
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/management/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                          <Eye size={13} />
                          <span>View Ticket</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading unassigned queue...' : 'Great! All submitted grievances are currently assigned to maintenance staff.'}
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

export default ManagementUnassigned;
