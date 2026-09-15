import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { managementApi, departmentsApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge, { PriorityBadge, EscalationBadge } from '../../components/StatusBadge';
import ComplaintStatusTimeline from '../../components/maintenance/ComplaintStatusTimeline';
import BeforeAfterPhotos from '../../components/complaints/BeforeAfterPhotos';
import SlaCountdown from '../../components/SlaCountdown';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Calendar, 
  Clock, 
  AlertCircle, 
  User, 
  FileText, 
  Wrench,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Sliders,
  MessageSquare,
  History,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const ManagementComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Intervention Modals
  const [assignModal, setAssignModal] = useState({ open: false, staffId: '' });
  const [reassignModal, setReassignModal] = useState({ open: false, staffId: '', reason: '' });
  const [priorityModal, setPriorityModal] = useState({ open: false, priority: 'High' });
  const [remarkModal, setRemarkModal] = useState({ open: false, remark: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, staffRes] = await Promise.all([
        managementApi.getComplaintDetails(id),
        managementApi.getStaffRoster()
      ]);

      if (compRes.data?.success && compRes.data?.complaint) {
        setComplaint(compRes.data.complaint);
      } else {
        setError(compRes.data?.message || 'Complaint record not found.');
      }
      if (staffRes.data?.success) {
        setStaffList(staffRes.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
      setError(err.message || 'Access denied or complaint not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data && String(data.id || data.complaint_id) === String(id)) {
        fetchDetails();
      }
    };
    socket.on('complaint:updated', handleUpdate);
    socket.on('complaint:status_updated', handleUpdate);
    socket.on('complaint:sla_warning', handleUpdate);
    socket.on('complaint:sla_breached', handleUpdate);

    return () => {
      socket.off('complaint:updated', handleUpdate);
      socket.off('complaint:status_updated', handleUpdate);
      socket.off('complaint:sla_warning', handleUpdate);
      socket.off('complaint:sla_breached', handleUpdate);
    };
  }, [socket, id, fetchDetails]);

  // Action Handlers
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignModal.staffId) return;
    try {
      setSubmitting(true);
      const res = await managementApi.assignComplaint(id, {
        maintenance_user_id: parseInt(assignModal.staffId, 10)
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setAssignModal({ open: false, staffId: '' });
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignModal.staffId || !reassignModal.reason) return;
    try {
      setSubmitting(true);
      const res = await managementApi.reassignComplaint(id, {
        maintenance_user_id: parseInt(reassignModal.staffId, 10),
        reason: reassignModal.reason
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setReassignModal({ open: false, staffId: '', reason: '' });
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to reassign complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await managementApi.updatePriority(id, {
        priority: priorityModal.priority
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setPriorityModal({ open: false, priority: 'High' });
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to update priority.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkModal.remark.trim()) return;
    try {
      setSubmitting(true);
      const res = await managementApi.addInternalRemark(id, {
        remark: remarkModal.remark.trim()
      });
      if (res.data?.success) {
        setFeedback('Internal management remark recorded.');
        setRemarkModal({ open: false, remark: '' });
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to record remark.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Clock size={32} className="spin" color="var(--color-brand-600)" />
        <div style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>Loading grievance details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2>Grievance Record Not Found</h2>
          <p style={{ color: 'var(--color-slate-600)', margin: '0.5rem 0 1.5rem' }}>{error || 'Unable to retrieve grievance details.'}</p>
          <button onClick={() => navigate('/management/complaints')} className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Return to All Complaints</span>
          </button>
        </div>
      </div>
    );
  }

  const deptStaff = staffList.filter(
    (s) => s.is_active && ((s.department || '').toLowerCase() === (complaint.department || '').toLowerCase() || s.department_id === complaint.department_id)
  );

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={() => navigate('/management/complaints')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}>
          <ArrowLeft size={14} />
          Back to All Complaints
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!complaint.assigned_to ? (
            <button
              onClick={() => setAssignModal({ open: true, staffId: '' })}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <UserPlus size={14} /> Assign Staff
            </button>
          ) : (
            <button
              onClick={() => setReassignModal({ open: true, staffId: '', reason: '' })}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <UserCheck size={14} /> Reassign
            </button>
          )}

          <button
            onClick={() => setPriorityModal({ open: true, priority: complaint.priority })}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <Sliders size={14} /> Priority
          </button>

          <button
            onClick={() => setRemarkModal({ open: true, remark: '' })}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <MessageSquare size={14} /> Internal Remark
          </button>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
          <button className="alert-close-btn" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      <div className="details-grid-layout">
        {/* Left Column: Complaint Details & Photos */}
        <div className="details-main-column">
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="complaint-id-tag">
                    {complaint.complaint_number}
                  </span>
                  <PriorityBadge priority={complaint.priority} />
                  <StatusBadge status={complaint.status} />
                  <EscalationBadge level={complaint.escalation_level} isOverdue={complaint.is_overdue} />
                </div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                  {complaint.title}
                </h1>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.2rem' }}>
                  DEPARTMENT
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                  {complaint.department || 'General'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.2rem' }}>
                  LOCATION
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                  {complaint.location}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.2rem' }}>
                  SUBMITTED ON
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                  {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
                Description
              </h3>
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--color-slate-200)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </div>
            </div>

            {/* Before / After Photo Viewer Component */}
            <BeforeAfterPhotos
              issuePhoto={complaint.issue_photo}
              resolutionPhoto={complaint.resolution_photo}
            />

            {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--color-slate-200)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.35rem' }}>
                  Resolution Remarks
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                  {complaint.resolution_remarks || 'No resolution remarks recorded.'}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)', display: 'flex', gap: '1rem' }}>
                  <span><strong>Resolved By:</strong> {complaint.assignee?.name || 'Maintenance Staff'}</span>
                  <span><strong>Resolved At:</strong> {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Timeline with Internal Remarks */}
          <div className="card mt-4" style={{ padding: '1.5rem' }}>
            <ComplaintStatusTimeline timeline={complaint.timeline || []} currentStatus={complaint.status} />
          </div>

          {/* Audit History Log */}
          {complaint.audit_history?.length > 0 && (
            <div className="card mt-4" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <History size={18} color="var(--color-brand-600)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                  Audit History ({complaint.audit_history.length} events)
                </h3>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Performed By</th>
                      <th>Change Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaint.audit_history.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{a.action}</td>
                        <td style={{ fontSize: '0.8rem' }}>{a.user_name || 'System'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-700)' }}>
                          {a.new_value || a.old_value || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: SLA Timer, Complainant & Staff Details */}
        <div className="details-sidebar-column">
          {/* Live SLA Countdown Card */}
          <div className="card mb-4" style={{ padding: '1.25rem' }}>
            <h3 className="section-subtitle">SLA & Countdown</h3>
            <SlaCountdown complaint={complaint} />
          </div>

          {/* Creator Information Card */}
          <div className="card mb-4" style={{ padding: '1.25rem' }}>
            <h3 className="section-subtitle">Submitted By (Complainant)</h3>
            <div className="user-info-box">
              <div className="info-row">
                <User size={15} className="info-icon" />
                <div>
                  <span className="info-label">Name</span>
                  <span className="info-val">{complaint.creator?.name || 'Anonymous'}</span>
                </div>
              </div>
              <div className="info-row">
                <Mail size={15} className="info-icon" />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-val">{complaint.creator?.email || 'N/A'}</span>
                </div>
              </div>
              <div className="info-row">
                <ShieldCheck size={15} className="info-icon" />
                <div>
                  <span className="info-label">Role / ID</span>
                  <span className="info-val" style={{ textTransform: 'capitalize' }}>
                    {complaint.creator?.role} {complaint.creator?.employee_or_student_id ? `(${complaint.creator.employee_or_student_id})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Maintenance Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 className="section-subtitle">Assigned Maintenance Staff</h3>
            {complaint.assignee ? (
              <div className="user-info-box">
                <div className="info-row">
                  <User size={15} className="info-icon" />
                  <div>
                    <span className="info-label">Staff Name</span>
                    <span className="info-val">{complaint.assignee.name}</span>
                  </div>
                </div>
                <div className="info-row">
                  <Wrench size={15} className="info-icon" />
                  <div>
                    <span className="info-label">Department</span>
                    <span className="info-val">{complaint.assignee.department || complaint.department || 'Maintenance'}</span>
                  </div>
                </div>
                <div className="info-row">
                  <Mail size={15} className="info-icon" />
                  <div>
                    <span className="info-label">Email</span>
                    <span className="info-val">{complaint.assignee.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 0' }}>
                ⚠ No maintenance staff assigned.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      {assignModal.open && (
        <div className="modal-overlay" onClick={() => setAssignModal({ open: false, staffId: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Complaint: {complaint.complaint_number}</h3>
              <button className="modal-close" onClick={() => setAssignModal({ open: false, staffId: '' })}>×</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                <label className="form-label">Select Technician ({complaint.department} Department):</label>
                <select
                  className="form-control"
                  value={assignModal.staffId}
                  onChange={(e) => setAssignModal({ ...assignModal, staffId: e.target.value })}
                  required
                >
                  <option value="">-- Choose technician --</option>
                  {deptStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department}) - Active Workload: {s.active_workload || 0}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModal({ open: false, staffId: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !assignModal.staffId}>
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModal.open && (
        <div className="modal-overlay" onClick={() => setReassignModal({ open: false, staffId: '', reason: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reassign Complaint: {complaint.complaint_number}</h3>
              <button className="modal-close" onClick={() => setReassignModal({ open: false, staffId: '', reason: '' })}>×</button>
            </div>
            <form onSubmit={handleReassign}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">New Technician:</label>
                  <select
                    className="form-control"
                    value={reassignModal.staffId}
                    onChange={(e) => setReassignModal({ ...reassignModal, staffId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose technician --</option>
                    {staffList.filter(s => s.is_active && s.id !== complaint.assigned_to).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reassignment Reason:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason for staff reassignment..."
                    value={reassignModal.reason}
                    onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReassignModal({ open: false, staffId: '', reason: '' })}>Cancel</button>
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
        <div className="modal-overlay" onClick={() => setPriorityModal({ open: false, priority: 'High' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Priority: {complaint.complaint_number}</h3>
              <button className="modal-close" onClick={() => setPriorityModal({ open: false, priority: 'High' })}>×</button>
            </div>
            <form onSubmit={handlePriorityChange}>
              <div className="modal-body">
                <label className="form-label">New Priority Level:</label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setPriorityModal({ open: false, priority: 'High' })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Remark Modal */}
      {remarkModal.open && (
        <div className="modal-overlay" onClick={() => setRemarkModal({ open: false, remark: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Management Internal Remark</h3>
              <button className="modal-close" onClick={() => setRemarkModal({ open: false, remark: '' })}>×</button>
            </div>
            <form onSubmit={handleAddRemark}>
              <div className="modal-body">
                <label className="form-label">Internal Remark:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Notes for management review and technician instructions..."
                  value={remarkModal.remark}
                  onChange={(e) => setRemarkModal({ ...remarkModal, remark: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRemarkModal({ open: false, remark: '' })}>Cancel</button>
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

export default ManagementComplaintDetails;
