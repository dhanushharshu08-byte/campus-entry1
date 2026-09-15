import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  managementApi, 
  departmentsApi 
} from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, EscalationBadge } from '../../components/StatusBadge';
import SlaCountdown from '../../components/SlaCountdown';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  UserPlus, 
  RefreshCw, 
  MessageSquare, 
  ShieldAlert, 
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const ManagementInterventions = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, unassigned, high, overdue, critical
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modal States
  const [assignModal, setAssignModal] = useState({ open: false, complaint: null, staffId: '' });
  const [reassignModal, setReassignModal] = useState({ open: false, complaint: null, staffId: '', reason: '' });
  const [priorityModal, setPriorityModal] = useState({ open: false, complaint: null, priority: 'High' });
  const [remarkModal, setRemarkModal] = useState({ open: false, complaint: null, remark: '' });
  const [submitting, setSubmitting] = useState(false);

  const { socket } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [compRes, staffRes, deptRes] = await Promise.all([
        managementApi.getComplaints({ limit: 100 }),
        managementApi.getStaffRoster(),
        departmentsApi.list()
      ]);

      if (compRes.data?.success) {
        setComplaints(compRes.data.complaints || []);
      }
      if (staffRes.data?.success) {
        setStaffList(staffRes.data.staff || []);
      }
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.departments || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load intervention queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on('management:dashboard_update', handleUpdate);
    socket.on('complaint:updated', handleUpdate);
    socket.on('complaint:status_updated', handleUpdate);
    socket.on('complaint:sla_warning', handleUpdate);
    socket.on('complaint:sla_breached', handleUpdate);
    socket.on('complaint:critical_escalation', handleUpdate);

    return () => {
      socket.off('management:dashboard_update', handleUpdate);
      socket.off('complaint:updated', handleUpdate);
      socket.off('complaint:status_updated', handleUpdate);
      socket.off('complaint:sla_warning', handleUpdate);
      socket.off('complaint:sla_breached', handleUpdate);
      socket.off('complaint:critical_escalation', handleUpdate);
    };
  }, [socket, fetchData]);

  // Filter complaints based on active tab
  const getFilteredComplaints = () => {
    return complaints.filter((c) => {
      const isUnassigned = !c.assigned_to;
      const isHighPriority = c.priority === 'High';
      const isOverdue = c.is_overdue;
      const isCritical = c.escalation_level === 3;
      const isActive = c.status !== 'Resolved' && c.status !== 'Closed';

      if (!isActive) return false;

      if (activeTab === 'unassigned') return isUnassigned;
      if (activeTab === 'high') return isHighPriority;
      if (activeTab === 'overdue') return isOverdue;
      if (activeTab === 'critical') return isCritical;

      // 'all' shows any ticket needing intervention
      return isUnassigned || isHighPriority || isOverdue || isCritical;
    });
  };

  const filtered = getFilteredComplaints();

  // Action Handlers
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignModal.staffId || !assignModal.complaint) return;
    try {
      setSubmitting(true);
      const res = await managementApi.assignComplaint(assignModal.complaint.id, {
        maintenance_user_id: parseInt(assignModal.staffId, 10)
      });
      if (res.data?.success) {
        setActionSuccess(res.data.message);
        setAssignModal({ open: false, complaint: null, staffId: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignModal.staffId || !reassignModal.reason || !reassignModal.complaint) return;
    try {
      setSubmitting(true);
      const res = await managementApi.reassignComplaint(reassignModal.complaint.id, {
        maintenance_user_id: parseInt(reassignModal.staffId, 10),
        reason: reassignModal.reason
      });
      if (res.data?.success) {
        setActionSuccess(res.data.message);
        setReassignModal({ open: false, complaint: null, staffId: '', reason: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to reassign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (e) => {
    e.preventDefault();
    if (!priorityModal.priority || !priorityModal.complaint) return;
    try {
      setSubmitting(true);
      const res = await managementApi.updatePriority(priorityModal.complaint.id, {
        priority: priorityModal.priority
      });
      if (res.data?.success) {
        setActionSuccess(res.data.message);
        setPriorityModal({ open: false, complaint: null, priority: 'High' });
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update priority.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkModal.remark || !remarkModal.complaint) return;
    try {
      setSubmitting(true);
      const res = await managementApi.addInternalRemark(remarkModal.complaint.id, {
        remark: remarkModal.remark
      });
      if (res.data?.success) {
        setActionSuccess('Internal remark recorded.');
        setRemarkModal({ open: false, complaint: null, remark: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add internal remark.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get department staff for assignment dropdown
  const getDeptStaff = (complaint) => {
    if (!complaint) return [];
    const deptName = (complaint.department || '').toLowerCase();
    return staffList.filter(
      (s) => s.is_active && ((s.department || '').toLowerCase() === deptName || s.department_id === complaint.department_id)
    );
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Management Interventions</h1>
          <p className="page-subtitle">
            Executive control panel for unassigned tickets, priority escalations, staff reassignments, and SLA breaches.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" title="Refresh queue">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="alert-close-btn" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-container" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Attention Items ({complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && (!c.assigned_to || c.priority === 'High' || c.is_overdue || c.escalation_level === 3)).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'unassigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('unassigned')}
        >
          Unassigned Queue ({complaints.filter(c => !c.assigned_to && c.status !== 'Resolved' && c.status !== 'Closed').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'high' ? 'active' : ''}`}
          onClick={() => setActiveTab('high')}
        >
          High Priority ({complaints.filter(c => c.priority === 'High' && c.status !== 'Resolved' && c.status !== 'Closed').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue / Breached ({complaints.filter(c => c.is_overdue && c.status !== 'Resolved' && c.status !== 'Closed').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
          onClick={() => setActiveTab('critical')}
        >
          Critical Escalation ({complaints.filter(c => c.escalation_level === 3 && c.status !== 'Resolved' && c.status !== 'Closed').length})
        </button>
      </div>

      {loading && complaints.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
          <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Scanning active complaints and SLA thresholds...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <CheckCircle2 size={48} color="#16a34a" />
          <h3>No Intervention Required</h3>
          <p>All grievances in this category are currently on schedule with active staff assignments.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((c) => (
            <div key={c.id} className={`card intervention-card ${c.escalation_level === 3 ? 'critical-border' : c.is_overdue ? 'overdue-border' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span className="complaint-id-tag">{c.complaint_number}</span>
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                  <EscalationBadge level={c.escalation_level} isOverdue={c.is_overdue} />
                </div>
                <div style={{ minWidth: '220px' }}>
                  <SlaCountdown complaint={c} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '0.35rem' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '0.75rem' }}>
                {c.description}
              </p>

              <div className="meta-grid" style={{ marginBottom: '1rem' }}>
                <div>
                  <span className="meta-label">Department:</span>
                  <span className="meta-val">{c.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="meta-label">Location:</span>
                  <span className="meta-val">{c.location}</span>
                </div>
                <div>
                  <span className="meta-label">Complainant:</span>
                  <span className="meta-val">{c.creator?.name || 'Student/Faculty'} ({c.creator?.role})</span>
                </div>
                <div>
                  <span className="meta-label">Assigned Technician:</span>
                  <span className="meta-val" style={{ fontWeight: c.assignee ? 600 : 400, color: c.assignee ? 'var(--color-slate-900)' : '#dc2626' }}>
                    {c.assignee ? c.assignee.name : '⚠ UNASSIGNED'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="intervention-actions">
                {!c.assigned_to ? (
                  <button
                    onClick={() => setAssignModal({ open: true, complaint: c, staffId: '' })}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    <UserPlus size={14} /> Assign Staff
                  </button>
                ) : (
                  <button
                    onClick={() => setReassignModal({ open: true, complaint: c, staffId: '', reason: '' })}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    <UserCheck size={14} /> Reassign Staff
                  </button>
                )}

                <button
                  onClick={() => setPriorityModal({ open: true, complaint: c, priority: c.priority })}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  <Sliders size={14} /> Change Priority
                </button>

                <button
                  onClick={() => setRemarkModal({ open: true, complaint: c, remark: '' })}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  <MessageSquare size={14} /> Internal Remark
                </button>

                <Link
                  to={`/management/complaints/${c.id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginLeft: 'auto' }}
                >
                  <span>Full Details</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Assignment Modal */}
      {assignModal.open && (
        <div className="modal-overlay" onClick={() => setAssignModal({ open: false, complaint: null, staffId: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Complaint: {assignModal.complaint?.complaint_number}</h3>
              <button className="modal-close" onClick={() => setAssignModal({ open: false, complaint: null, staffId: '' })}>×</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '1rem' }}>
                  Assigning ticket for <strong>{assignModal.complaint?.department}</strong> department.
                </p>
                <label className="form-label">Select Maintenance Technician:</label>
                <select
                  className="form-control"
                  value={assignModal.staffId}
                  onChange={(e) => setAssignModal({ ...assignModal, staffId: e.target.value })}
                  required
                >
                  <option value="">-- Choose active technician --</option>
                  {getDeptStaff(assignModal.complaint).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department}) - Active Workload: {s.active_complaints || s.active_workload || 0} tickets
                    </option>
                  ))}
                </select>
                {getDeptStaff(assignModal.complaint).length === 0 && (
                  <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    No active maintenance staff found for this department. Please check Staff Management.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModal({ open: false, complaint: null, staffId: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !assignModal.staffId}>
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {reassignModal.open && (
        <div className="modal-overlay" onClick={() => setReassignModal({ open: false, complaint: null, staffId: '', reason: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reassign Complaint: {reassignModal.complaint?.complaint_number}</h3>
              <button className="modal-close" onClick={() => setReassignModal({ open: false, complaint: null, staffId: '', reason: '' })}>×</button>
            </div>
            <form onSubmit={handleReassign}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '0.75rem' }}>
                  Currently assigned to: <strong>{reassignModal.complaint?.assignee?.name || 'N/A'}</strong>
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">New Technician:</label>
                  <select
                    className="form-control"
                    value={reassignModal.staffId}
                    onChange={(e) => setReassignModal({ ...reassignModal, staffId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose technician --</option>
                    {staffList.filter(s => s.is_active && s.id !== reassignModal.complaint?.assigned_to).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department}) - Workload: {s.active_complaints || s.active_workload || 0} tickets
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reason for Reassignment (Required):</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Technician unavailable, workload rebalance, skill escalation..."
                    value={reassignModal.reason}
                    onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReassignModal({ open: false, complaint: null, staffId: '', reason: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !reassignModal.staffId || !reassignModal.reason.trim()}>
                  {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Priority Modal */}
      {priorityModal.open && (
        <div className="modal-overlay" onClick={() => setPriorityModal({ open: false, complaint: null, priority: 'High' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Priority: {priorityModal.complaint?.complaint_number}</h3>
              <button className="modal-close" onClick={() => setPriorityModal({ open: false, complaint: null, priority: 'High' })}>×</button>
            </div>
            <form onSubmit={handlePriorityChange}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '0.75rem' }}>
                  Changing priority will automatically recalculate the SLA resolution deadline.
                </p>
                <label className="form-label">Select New Priority Level:</label>
                <select
                  className="form-control"
                  value={priorityModal.priority}
                  onChange={(e) => setPriorityModal({ ...priorityModal, priority: e.target.value })}
                >
                  <option value="High">High (4 Hours SLA)</option>
                  <option value="Medium">Medium (24 Hours SLA)</option>
                  <option value="Low">Low (72 Hours SLA)</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPriorityModal({ open: false, complaint: null, priority: 'High' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Internal Remark Modal */}
      {remarkModal.open && (
        <div className="modal-overlay" onClick={() => setRemarkModal({ open: false, complaint: null, remark: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Management Internal Remark</h3>
              <button className="modal-close" onClick={() => setRemarkModal({ open: false, complaint: null, remark: '' })}>×</button>
            </div>
            <form onSubmit={handleAddRemark}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '0.75rem' }}>
                  Internal remarks are visible exclusively to Management and will not be displayed on student/faculty portals.
                </p>
                <label className="form-label">Internal Remark:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Enter internal notes, technician instructions, or vendor follow-up details..."
                  value={remarkModal.remark}
                  onChange={(e) => setRemarkModal({ ...remarkModal, remark: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRemarkModal({ open: false, complaint: null, remark: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !remarkModal.remark.trim()}>
                  {submitting ? 'Saving...' : 'Record Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementInterventions;
