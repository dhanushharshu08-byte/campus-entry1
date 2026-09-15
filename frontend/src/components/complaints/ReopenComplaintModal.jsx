import React, { useState } from 'react';
import { complaintsApi } from '../../services/api';
import { RotateCcw, X, AlertCircle, RefreshCw } from 'lucide-react';

const ReopenComplaintModal = ({ complaintId, isOpen, onClose, onReopenSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a reason for reopening this grievance.');
      return;
    }
    if (trimmed.length < 10) {
      setError('Reopen reason must be at least 10 characters long.');
      return;
    }
    if (trimmed.length > 1000) {
      setError('Reopen reason cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintsApi.reopen(complaintId, { reason: trimmed });
      if (res.data && res.data.success) {
        if (onReopenSuccess) {
          onReopenSuccess(res.data.complaint);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to reopen complaint:', err);
      setError(err.message || 'Failed to reopen complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <RotateCcw size={20} className="modal-title-icon warning" />
            <h3>Request Grievance Reopening</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            If the issue was not completely fixed, explain what remains unresolved so the maintenance team can inspect and attend to it.
          </p>

          {error && (
            <div className="error-alert mb-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label required">Reason for Reopening</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify what was incomplete or still broken (min 10 characters)..."
                rows={4}
                className="form-textarea"
                maxLength={1000}
                disabled={submitting}
              />
              <div className="char-count">{reason.length} / 1000 characters</div>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-warning"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Reopening complaint...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Reopen Complaint</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReopenComplaintModal;
