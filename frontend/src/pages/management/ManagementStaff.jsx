import React, { useState, useEffect, useCallback } from 'react';
import { managementApi } from '../../services/api';
import StaffWorkloadChart from '../../components/management/StaffWorkloadChart';
import CreateMaintenanceStaffModal from '../../components/management/CreateMaintenanceStaffModal';
import CreateManagementStaffModal from '../../components/management/CreateManagementStaffModal';
import { Users, Mail, Wrench, AlertTriangle, CheckCircle2, Plus, RefreshCw, Shield } from 'lucide-react';

const ManagementStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateMgmtModal, setShowCreateMgmtModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managementApi.getStaffPerformance();
      if (res.data?.success) {
        setStaff(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance staff performance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{feedback}</span>
          </div>
          <button 
            type="button" 
            className="alert-close-btn" 
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#065f46' }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--color-brand-600)" />
            Maintenance Staff Performance & Workload Monitoring
          </h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
            Real-time operational tracking of active maintenance personnel, assigned ticket loads, and resolution performance.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>+ Add Maintenance Staff</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateMgmtModal(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Shield size={16} color="#2563eb" />
            <span>+ Add Management User</span>
          </button>
          <button 
            type="button" 
            onClick={fetchStaff} 
            className="btn btn-secondary" 
            title="Refresh Staff Metrics"
            style={{ padding: '0.6rem 0.8rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <StaffWorkloadChart staff={staff} />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Staff Member Directory & Metrics</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Email Address</th>
                <th style={{ textAlign: 'center' }}>Active Complaints</th>
                <th style={{ textAlign: 'center' }}>In Progress</th>
                <th style={{ textAlign: 'center' }}>Resolved</th>
                <th style={{ textAlign: 'center' }}>Closed</th>
                <th style={{ textAlign: 'center' }}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{member.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-assigned" style={{ fontSize: '0.78rem' }}>
                        {member.department}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                        {member.email}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: member.active_complaints >= 5 ? '#dc2626' : 'var(--color-slate-900)' }}>
                      {member.active_complaints}
                    </td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{member.in_progress}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>{member.resolved}</td>
                    <td style={{ textAlign: 'center', color: '#475569', fontWeight: 600 }}>{member.closed}</td>
                    <td style={{ textAlign: 'center' }}>
                      {member.overdue > 0 ? (
                        <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
                          {member.overdue}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-slate-400)' }}>0</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading staff performance...' : 'No active maintenance staff members registered.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateMaintenanceStaffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(createdUser) => {
          setFeedback(`Maintenance staff account created successfully for ${createdUser.name} (${createdUser.email}).`);
          fetchStaff();
        }}
      />

      <CreateManagementStaffModal
        isOpen={showCreateMgmtModal}
        onClose={() => setShowCreateMgmtModal(false)}
        onSuccess={(createdUser) => {
          setFeedback(`Management administrator account created successfully for ${createdUser.name} (${createdUser.email}).`);
          fetchStaff();
        }}
      />
    </div>
  );
};

export default ManagementStaff;
