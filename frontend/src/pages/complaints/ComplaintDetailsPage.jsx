import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { complaintsApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge, { PriorityBadge, EscalationBadge } from '../../components/StatusBadge';
import ComplaintStatusTimeline from '../../components/maintenance/ComplaintStatusTimeline';
import BeforeAfterPhotos from '../../components/complaints/BeforeAfterPhotos';
import ReopenComplaintModal from '../../components/complaints/ReopenComplaintModal';
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
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Wrench,
  RefreshCw
} from 'lucide-react';

const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [closing, setClosing] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintsApi.get(id);
      if (res.data?.success && res.data?.complaint) {
        setComplaint(res.data.complaint);
        setTimeline(res.data.complaint.timeline || []);
      } else {
        setError(res.data?.message || 'Failed to load complaint details.');
      }
    } catch (err) {
      setError(err.message || 'Grievance not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Real-time listener for complaint updates from maintenance staff
  useEffect(() => {
    if (!socket) return;
    const handleComplaintUpdated = (data) => {
      if (data && String(data.id || data.complaint_id) === String(id)) {
        fetchDetails();
      }
    };

    socket.on('complaint:updated', handleComplaintUpdated);
    socket.on('complaint:status_updated', handleComplaintUpdated);

    return () => {
      socket.off('complaint:updated', handleComplaintUpdated);
      socket.off('complaint:status_updated', handleComplaintUpdated);
    };
  }, [socket, id, fetchDetails]);

  const handleCloseComplaint = async () => {
    setClosing(true);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await complaintsApi.close(id);
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
        setActionSuccess('Thank you! Grievance has been confirmed and closed.');
      }
    } catch (err) {
      console.error('Failed to close complaint:', err);
      setError(err.message || 'Failed to close complaint.');
    } finally {
      setClosing(false);
    }
  };

  const handleReopenSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
    setActionSuccess('Grievance has been reopened and sent back to maintenance staff.');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div className="spin" style={{ width: '36px', height: '36px', border: '3px solid var(--color-slate-200)', borderTopColor: 'var(--color-brand-600)', borderRadius: '50%' }} />
        <div style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>Loading grievance details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
            Access Error
          </h2>
          <p style={{ color: 'var(--color-slate-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || 'Unable to retrieve grievance record.'}
          </p>
          <button onClick={() => navigate('/complaints')} className="btn btn-primary">
            <ArrowLeft size={16} />
            Return to My Grievances
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = complaint.created_at
    ? new Date(complaint.created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/complaints')} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}>
          <ArrowLeft size={14} />
          Back to My Grievances
        </button>
        <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)' }}>
          Tracking Number: <strong style={{ fontFamily: 'monospace', color: 'var(--color-brand-700)' }}>{complaint.complaint_number}</strong>
        </span>
      </div>

      {actionSuccess && (
        <div className="success-alert-banner mb-3">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* RESOLUTION REVIEW CALLOUT BANNER (When status is Resolved) */}
      {complaint.status === 'Resolved' && (
        <div className="resolution-review-banner">
          <div className="review-banner-header">
            <CheckCircle2 size={22} className="text-success" />
            <div>
              <h4>Was this issue resolved successfully?</h4>
              <p>The maintenance team has marked your grievance as resolved. Please review the after-repair proof below and confirm closure.</p>
            </div>
          </div>
          <div className="review-banner-actions">
            <button
              onClick={handleCloseComplaint}
              disabled={closing}
              className="btn btn-primary btn-sm"
            >
              {closing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Closing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Yes, Close Complaint</span>
                </>
              )}
            </button>
            <button
              onClick={() => setReopenModalOpen(true)}
              disabled={closing}
              className="btn btn-warning btn-sm"
            >
              <RotateCcw size={14} />
              <span>Not Resolved</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="complaint-id-tag">
                {complaint.complaint_number}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
              <EscalationBadge level={complaint.escalation_level} isOverdue={complaint.is_overdue} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-900)', lineHeight: '1.3' }}>
              {complaint.title}
            </h1>
          </div>

          <div style={{ minWidth: '220px' }}>
            <SlaCountdown complaint={complaint} />
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.35rem' }}>
              <Building size={14} color="var(--color-brand-600)" />
              <span>MAINTENANCE DEPARTMENT</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
              {complaint.department || 'General'}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.35rem' }}>
              <MapPin size={14} color="#dc2626" />
              <span>FACILITY LOCATION</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
              {complaint.location}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.35rem' }}>
              <Wrench size={14} color="#d97706" />
              <span>ASSIGNED TO</span>
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
              {complaint.assignee?.name || 'Unassigned Queue'}
            </div>
            {complaint.assignee?.email && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                {complaint.assignee.email}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Description */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
            Detailed Grievance Description
          </h3>
          <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--color-slate-200)', color: 'var(--color-slate-800)', fontSize: '0.925rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {complaint.description}
          </div>
        </div>

        {/* BEFORE & AFTER PHOTO COMPARISON (When Resolved or Closed) */}
        {(complaint.status === 'Resolved' || complaint.status === 'Closed') ? (
          <div>
            <BeforeAfterPhotos
              issuePhoto={complaint.issue_photo}
              resolutionPhoto={complaint.resolution_photo}
            />

            <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--color-slate-200)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
                Maintenance Resolution Remarks
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-700)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                {complaint.resolution_remarks || 'No resolution remarks provided.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                <span><strong>Resolved By:</strong> {complaint.assignee?.name || 'Maintenance Staff'}</span>
                <span><strong>Resolved At:</strong> {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : 'N/A'}</span>
                {complaint.closed_at && (
                  <span><strong>Closed At:</strong> {new Date(complaint.closed_at).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single Issue Photo View for Open Complaints */
          complaint.issue_photo && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '0.75rem' }}>
                Uploaded Issue Photo Attachment
              </h3>
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-slate-300)', display: 'inline-block' }}>
                <img
                  src={complaint.issue_photo.startsWith('http') ? complaint.issue_photo : `${import.meta.env.VITE_API_URL || ''}${complaint.issue_photo}`}
                  alt="Issue Attachment"
                  style={{ maxHeight: '320px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          )
        )}
      </div>

      {/* Status Timeline */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <ComplaintStatusTimeline timeline={timeline} currentStatus={complaint.status} />
      </div>

      {/* Reopen Modal Component */}
      <ReopenComplaintModal
        complaintId={complaint.id}
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        onReopenSuccess={handleReopenSuccess}
      />
    </div>
  );
};

export default ComplaintDetailsPage;
