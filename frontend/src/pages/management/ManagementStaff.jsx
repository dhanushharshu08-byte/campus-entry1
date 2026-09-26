import React, { useState, useEffect, useCallback } from 'react';
import { managementApi, departmentsApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StaffWorkloadChart from '../../components/management/StaffWorkloadChart';
import CreateMaintenanceStaffModal from '../../components/management/CreateMaintenanceStaffModal';
import CreateManagementStaffModal from '../../components/management/CreateManagementStaffModal';
import { 
  Users, 
  Mail, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Shield, 
  Trash2, 
  UserCheck, 
  UserX, 
  ArrowRightLeft, 
  X, 
  Building 
} from 'lucide-react';

const ManagementStaff = () => {
  const { socket } = useSocket();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateMgmtModal, setShowCreateMgmtModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals for staff management
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [reassigningStaff, setReassigningStaff] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [activeComplaintsList, setActiveComplaintsList] = useState([]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managementApi.getStaffPerformance();
      if (res.data?.success) {
        setStaff(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance staff performance:', err);
      setErrorMessage(err.message || 'Failed to fetch staff performance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Real-time Socket.IO listener for live roster & workload updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchStaff();
    };

    socket.on('management:dashboard_update', handleUpdate);
    socket.on('user:status_changed', handleUpdate);
    socket.on('complaint:created', handleUpdate);
    socket.on('complaint:assigned', handleUpdate);
    socket.on('complaint:resolved', handleUpdate);

    return () => {
      socket.off('management:dashboard_update', handleUpdate);
      socket.off('user:status_changed', handleUpdate);
      socket.off('complaint:created', handleUpdate);
      socket.off('complaint:assigned', handleUpdate);
      socket.off('complaint:resolved', handleUpdate);
    };
  }, [socket, fetchStaff]);

  // Toggle Staff Active/Inactive Status
  const handleToggleStatus = async (member) => {
    const isDeactivating = member.is_active;
    if (isDeactivating && member.active_complaints > 0) {
      // Prompt reassignment before deactivation
      try {
        const res = await managementApi.getUserActiveComplaints(member.id);
        setActiveComplaintsList(res.data?.complaints || []);
      } catch {
        setActiveComplaintsList([]);
      }
      setReassigningStaff(member);
      setReassignTargetId('');
      setReassignReason(`Reassignment upon ${member.name}'s deactivation`);
      return;
    }

    if (!window.confirm(`Are you sure you want to ${isDeactivating ? 'deactivate' : 'activate'} staff member ${member.name}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.updateUserStatus(member.id, { is_active: !member.is_active });
      if (res.data?.success) {
        setFeedback(res.data.message || `Status updated for ${member.name}.`);
        fetchStaff();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update staff status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reassign Modal
  const openReassignModal = async (member) => {
    try {
      const res = await managementApi.getUserActiveComplaints(member.id);
      setActiveComplaintsList(res.data?.complaints || []);
    } catch {
      setActiveComplaintsList([]);
    }
    setReassigningStaff(member);
    setReassignTargetId('');
    setReassignReason(`Workload rebalancing from ${member.name}`);
  };

  // Submit Reassignment
  const handleExecuteReassignment = async (e) => {
    e.preventDefault();
    if (!reassigningStaff) return;
    if (!reassignTargetId) {
      alert('Please select a target maintenance technician for reassignment.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.reassignUserComplaints(reassigningStaff.id, {
        new_assigned_to: reassignTargetId,
        reason: reassignReason || `Reassigned from ${reassigningStaff.name}`,
        reassign_all: true
      });
      if (res.data?.success) {
        setFeedback(res.data.message || `Complaints successfully reassigned.`);
        setReassigningStaff(null);
        fetchStaff();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to reassign complaints.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete/Remove Staff Modal
  const openDeleteModal = async (member) => {
    if (member.active_complaints > 0) {
      try {
        const res = await managementApi.getUserActiveComplaints(member.id);
        setActiveComplaintsList(res.data?.complaints || []);
      } catch {
        setActiveComplaintsList([]);
      }
    } else {
      setActiveComplaintsList([]);
    }
    setDeletingStaff(member);
    setReassignTargetId('');
  };

  // Submit Delete Staff
  const handleExecuteDelete = async () => {
    if (!deletingStaff) return;

    try {
      setActionLoading(true);
      const res = await managementApi.deleteUser(deletingStaff.id, {
        new_assigned_to: reassignTargetId || null
      });
      if (res.data?.success) {
        setFeedback(res.data.message || `Staff member removed successfully.`);
        setDeletingStaff(null);
        fetchStaff();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const otherActiveStaff = staff.filter(
    (s) => s.is_active && (reassigningStaff ? s.id !== reassigningStaff.id : deletingStaff ? s.id !== deletingStaff.id : true)
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
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

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            className="alert-close-btn" 
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#991b1b' }}
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
            Manage active maintenance technicians, add or remove staff, reassign grievance workloads, and track performance.
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className="card-title">Staff Member Directory & Actions</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
            Total Staff: <strong>{staff.length}</strong> | Active: <strong>{staff.filter(s => s.is_active).length}</strong>
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Email Address</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Active Tickets</th>
                <th style={{ textAlign: 'center' }}>In Progress</th>
                <th style={{ textAlign: 'center' }}>Resolved</th>
                <th style={{ textAlign: 'center' }}>Closed</th>
                <th style={{ textAlign: 'center' }}>Overdue</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member.id} style={{ opacity: member.is_active ? 1 : 0.65 }}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{member.name}</div>
                      {member.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{member.phone}</div>
                      )}
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
                    <td style={{ textAlign: 'center' }}>
                      {member.is_active ? (
                        <span className="badge badge-resolved" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-closed" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                          Inactive
                        </span>
                      )}
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
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {member.active_complaints > 0 && (
                          <button
                            type="button"
                            onClick={() => openReassignModal(member)}
                            className="btn btn-secondary"
                            title="Reassign active complaints"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#2563eb' }}
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member)}
                          className="btn btn-secondary"
                          title={member.is_active ? "Deactivate Staff" : "Activate Staff"}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: member.is_active ? '#d97706' : '#059669' }}
                          disabled={actionLoading}
                        >
                          {member.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(member)}
                          className="btn btn-secondary"
                          title="Remove / Delete Staff Member"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                          disabled={actionLoading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading staff performance...' : 'No maintenance staff members registered.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Complaints Modal */}
      {reassigningStaff && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={18} color="#2563eb" />
                Reassign Grievances: {reassigningStaff.name}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setReassigningStaff(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteReassignment}>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '1rem' }}>
                  <strong>{reassigningStaff.name}</strong> currently has <strong>{reassigningStaff.active_complaints}</strong> active assigned ticket(s). Select a replacement technician to receive these complaints:
                </p>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Target Maintenance Technician *</label>
                  <select
                    className="form-control"
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Active Technician --</option>
                    {otherActiveStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department}) — {s.active_complaints} active tickets
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Reassignment Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g. Technician reassignment / workload balance"
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReassigningStaff(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !reassignTargetId}>
                  {actionLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Staff Modal */}
      {deletingStaff && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <Trash2 size={18} />
                Remove Staff Member: {deletingStaff.name}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingStaff(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-700)', marginBottom: '1rem' }}>
                Are you sure you want to permanently remove <strong>{deletingStaff.name}</strong> ({deletingStaff.email}) from the maintenance roster?
              </p>

              {deletingStaff.active_complaints > 0 && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} />
                    Active Tickets Detected ({deletingStaff.active_complaints})
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#92400e', marginBottom: '0.6rem' }}>
                    Optionally choose a replacement technician to inherit all active complaints, or leave unselected to return tickets to the department pool (Unassigned):
                  </p>
                  <select
                    className="form-control"
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">-- Unassign & Return to Department Pool --</option>
                    {otherActiveStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        Reassign to {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeletingStaff(null)}>
                Cancel
              </button>
              <button type="button" className="btn" style={{ backgroundColor: '#dc2626', color: '#fff' }} onClick={handleExecuteDelete} disabled={actionLoading}>
                {actionLoading ? 'Removing...' : 'Confirm Remove Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

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
