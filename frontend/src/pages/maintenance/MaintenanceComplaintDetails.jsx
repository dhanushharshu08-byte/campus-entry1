import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { maintenanceApi } from '../../services/api';
import StatusBadge, { PriorityBadge, EscalationBadge } from '../../components/StatusBadge';
import ComplaintStatusTimeline from '../../components/maintenance/ComplaintStatusTimeline';
import ResolutionForm from '../../components/complaints/ResolutionForm';
import BeforeAfterPhotos from '../../components/complaints/BeforeAfterPhotos';
import SlaCountdown from '../../components/SlaCountdown';
import { 
  ArrowLeft, 
  Wrench, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Play,
  ShieldAlert
} from 'lucide-react';

const MaintenanceComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await maintenanceApi.getComplaintDetails(id);
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      console.error('Failed to load maintenance complaint details:', err);
      setError(err.message || 'Access denied or complaint not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Socket.IO listener for ticket updates
  useEffect(() => {
    if (!socket) return;
    const handleComplaintUpdated = (data) => {
      if (data && String(data.id || data.complaint_id) === String(id)) {
        fetchDetails();
      }
    };

    socket.on('complaint:updated', handleComplaintUpdated);
    socket.on('complaint:status_updated', handleComplaintUpdated);
    socket.on('complaint:sla_warning', handleComplaintUpdated);
    socket.on('complaint:sla_breached', handleComplaintUpdated);

    return () => {
      socket.off('complaint:updated', handleComplaintUpdated);
      socket.off('complaint:status_updated', handleComplaintUpdated);
      socket.off('complaint:sla_warning', handleComplaintUpdated);
      socket.off('complaint:sla_breached', handleComplaintUpdated);
    };
  }, [socket, id, fetchDetails]);

  const handleAcceptWork = async () => {
    setAccepting(true);
    setActionSuccess(null);
    try {
      const res = await maintenanceApi.acceptComplaint(id);
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
        setActionSuccess('Complaint accepted and marked as In Progress!');
      }
    } catch (err) {
      console.error('Failed to accept complaint:', err);
      setError(err.message || 'Failed to accept complaint.');
    } finally {
      setAccepting(false);
    }
  };

  const handleResolvedSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
    setActionSuccess(`Complaint ${updatedComplaint.complaint_number} has been resolved successfully.`);
  };

  if (loading) {
    return (
      <div className="details-page-container">
        <div className="loading-state">
          <Clock size={28} className="spin" />
          <p>Loading grievance details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="details-page-container">
        <div className="error-card">
          <AlertCircle size={32} color="var(--color-danger)" />
          <h2>Access Restricted</h2>
          <p>{error || 'Grievance ticket not found or not assigned to you.'}</p>
          <Link to="/maintenance/dashboard" className="btn btn-secondary mt-3">
            <ArrowLeft size={16} />
            <span>Back to Maintenance Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="details-page-container">
      {/* Top Navigation */}
      <div className="details-nav-bar">
        <Link to="/maintenance/dashboard" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Assigned Queue</span>
        </Link>
        <div className="ticket-header-meta">
          <span className="complaint-id-tag">{complaint.complaint_number}</span>
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
          <EscalationBadge level={complaint.escalation_level} isOverdue={complaint.is_overdue} />
        </div>
      </div>

      {/* Overdue Warning Banner */}
      {complaint.is_overdue && complaint.status !== 'Resolved' && complaint.status !== 'Closed' && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <ShieldAlert size={18} />
          <div>
            <strong>SLA DEADLINE BREACHED</strong>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>This ticket is past its resolution target. Please expedite repair and update remarks.</p>
          </div>
        </div>
      )}

      {/* Action Banner for Assigned / Submitted */}
      {(complaint.status === 'Assigned' || complaint.status === 'Submitted') && (
        <div className="action-callout-banner">
          <div className="callout-info">
            <Wrench size={20} />
            <div>
              <h4>New Grievance Assigned to You</h4>
              <p>Review the details below and click "Accept / Start Work" to inform the user and begin resolution.</p>
            </div>
          </div>
          <button
            onClick={handleAcceptWork}
            disabled={accepting}
            className="btn btn-primary"
          >
            <Play size={16} />
            <span>{accepting ? 'Starting Work...' : 'Accept / Start Work'}</span>
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="success-alert-banner">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="details-grid-layout">
        {/* Left Column: Complaint Details & Resolution Form */}
        <div className="details-main-column">
          <div className="content-card">
            <div className="card-header-row">
              <h1 className="ticket-title">{complaint.title}</h1>
            </div>

            <div className="meta-tags-row">
              <div className="meta-tag">
                <MapPin size={14} />
                <span>{complaint.location}</span>
              </div>
              <div className="meta-tag">
                <Wrench size={14} />
                <span>Department: {complaint.department || 'General'}</span>
              </div>
              <div className="meta-tag">
                <Calendar size={14} />
                <span>Submitted: {new Date(complaint.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="section-divider" />

            <h3 className="section-subtitle">Grievance Description</h3>
            <p className="description-text">{complaint.description}</p>
          </div>

          {/* Maintenance Resolution Form Component (When Status is In Progress) */}
          {complaint.status === 'In Progress' && (
            <div className="mt-4">
              <ResolutionForm
                complaintId={complaint.id}
                onResolvedSuccess={handleResolvedSuccess}
              />
            </div>
          )}

          {/* Before vs After Photo Comparison (When Resolved or Closed) */}
          {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
            <div className="content-card mt-4">
              <BeforeAfterPhotos
                issuePhoto={complaint.issue_photo}
                resolutionPhoto={complaint.resolution_photo}
              />

              <div className="section-divider" />

              <h3 className="section-subtitle">Resolution Summary</h3>
              <div className="resolution-summary-box">
                <div className="summary-row">
                  <strong>Resolution Remarks:</strong>
                  <p>{complaint.resolution_remarks || 'No resolution remarks recorded.'}</p>
                </div>
                <div className="summary-meta">
                  <span>
                    <strong>Resolved By:</strong> {complaint.assignee?.name || user?.name || 'Maintenance Staff'}
                  </span>
                  <span>
                    <strong>Resolved At:</strong>{' '}
                    {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log & Timeline Component */}
          <div className="content-card mt-4">
            <ComplaintStatusTimeline
              timeline={complaint.timeline || []}
              currentStatus={complaint.status}
            />
          </div>
        </div>

        {/* Right Column: SLA Timer & Complainant Details */}
        <div className="details-sidebar-column">
          {/* Live SLA Countdown Card */}
          <div className="content-card mb-4">
            <h3 className="section-subtitle">Service Level Agreement</h3>
            <SlaCountdown complaint={complaint} />
          </div>

          {/* Complainant Info */}
          <div className="content-card">
            <h3 className="section-subtitle">Submitted By (Complainant)</h3>
            <div className="user-info-box">
              <div className="info-row">
                <User size={16} className="info-icon" />
                <div>
                  <span className="info-label">Full Name</span>
                  <span className="info-val">{complaint.creator?.name || 'Anonymous User'}</span>
                </div>
              </div>

              <div className="info-row">
                <Mail size={16} className="info-icon" />
                <div>
                  <span className="info-label">Email Address</span>
                  <span className="info-val">{complaint.creator?.email || 'N/A'}</span>
                </div>
              </div>

              {complaint.creator?.employee_or_student_id && (
                <div className="info-row">
                  <User size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Student / Staff ID</span>
                    <span className="info-val">{complaint.creator.employee_or_student_id}</span>
                  </div>
                </div>
              )}

              {complaint.creator?.phone && (
                <div className="info-row">
                  <Phone size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Contact Phone</span>
                    <span className="info-val">{complaint.creator.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceComplaintDetails;
