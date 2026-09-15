import React, { useState, useRef } from 'react';
import { maintenanceApi } from '../../services/api';
import { Upload, X, CheckCircle2, AlertCircle, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';

const ResolutionForm = ({ complaintId, onResolvedSuccess, onCancel }) => {
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File size exceeds the 5 MB maximum limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      setError('Resolution remarks are required.');
      return;
    }
    if (trimmedRemarks.length < 10) {
      setError('Resolution remarks must be at least 10 characters long.');
      return;
    }
    if (trimmedRemarks.length > 2000) {
      setError('Resolution remarks cannot exceed 2000 characters.');
      return;
    }

    if (!selectedFile) {
      setError('Please upload an After-Repair photo as proof of resolution.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('resolution_remarks', trimmedRemarks);
      formData.append('resolution_photo', selectedFile);

      const res = await maintenanceApi.resolveComplaint(complaintId, formData);
      if (res.data && res.data.success) {
        if (onResolvedSuccess) {
          onResolvedSuccess(res.data.complaint);
        }
      }
    } catch (err) {
      console.error('Failed to submit resolution:', err);
      setError(err.message || 'Failed to submit resolution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="resolution-form-card">
      <div className="form-card-header">
        <CheckCircle2 size={22} className="header-icon-success" />
        <div>
          <h3>Resolve & Complete Grievance</h3>
          <p>Provide details and attach an after-repair photo to complete this maintenance task.</p>
        </div>
      </div>

      {error && (
        <div className="error-alert mb-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Resolution Remarks */}
        <div className="form-group mb-3">
          <label className="form-label required">Resolution Remarks / Remedial Work Done</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe the actions taken to repair or resolve this grievance (min 10 characters)..."
            rows={4}
            className="form-textarea"
            maxLength={2000}
            disabled={submitting}
          />
          <div className="char-count">{remarks.length} / 2000 characters</div>
        </div>

        {/* Upload Resolution Photo */}
        <div className="form-group mb-4">
          <label className="form-label required">Upload After-Repair Photo Attachment</label>
          
          {!selectedFile ? (
            <div
              className="dropzone-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} className="dropzone-icon" />
              <div className="dropzone-text">Click or drag & drop after-repair photo here</div>
              <div className="dropzone-subtext">JPG, JPEG, PNG, WEBP (Max 5 MB)</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={submitting}
              />
            </div>
          ) : (
            <div className="file-preview-card">
              <div className="file-preview-main">
                <img src={previewUrl} alt="After repair preview" className="file-thumb" />
                <div className="file-meta">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="btn-remove-file"
                disabled={submitting}
                title="Remove image"
              >
                <X size={16} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="form-actions-row">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Resolving complaint...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Mark as Resolved</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResolutionForm;
