import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentsApi, complaintsApi } from '../../services/api';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  PlusCircle, 
  FileText, 
  MapPin, 
  AlertTriangle, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Building,
  Layers,
  Sparkles
} from 'lucide-react';

const MAINTENANCE_DEPARTMENTS = [
  { id: 1, name: 'Electrical', description: 'Power supply, lighting, switchboards, wiring, fans, and lab power' },
  { id: 2, name: 'Plumbing', description: 'Restrooms, water coolers, piping, taps, drainage, and pumps' },
  { id: 3, name: 'Civil', description: 'Masonry, plastering, doors, windows, paint, ceiling, and flooring' },
  { id: 8, name: 'Carpentry', description: 'Desks, benches, podiums, lab furniture, doors, and cupboards' },
  { id: 9, name: 'Cleaning', description: 'Classroom housekeeping, sanitation, washrooms, and waste disposal' },
  { id: 6, name: 'IT / Network', description: 'Computers, projectors, lab systems, WiFi, LAN, and smart boards' },
  { id: 7, name: 'Other', description: 'General facilities, sports equipment, signage, and miscellaneous' }
];

const NewComplaintPage = () => {
  const [departments, setDepartments] = useState(MAINTENANCE_DEPARTMENTS);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    department_id: '1',
    building: COLLEGE_CONFIG.CAMPUS_BLOCKS[0],
    floor: COLLEGE_CONFIG.CAMPUS_FLOORS[0],
    room_or_spot: '',
    priority: 'Medium',
    description: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Synchronize active departments dynamically from API if available
  useEffect(() => {
    let isMounted = true;
    const fetchDepts = async () => {
      try {
        const res = await departmentsApi.list();
        const depts = res.data?.departments || (Array.isArray(res.data) ? res.data : []);
        if (isMounted && Array.isArray(depts) && depts.length > 0) {
          setDepartments(depts);
        }
      } catch (err) {
        console.warn('API departments note: Using verified local default departments:', err);
      }
    };
    fetchDepts();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setFieldErrors([]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setFormError('Only JPG, JPEG, PNG, and WEBP image files are supported.');
      return;
    }

    // Validate size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds maximum 5 MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);
    setFormError(null);
    setFieldErrors([]);

    // Generate preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClearFile = () => {
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
    if (isSubmitting) return;

    setFormError(null);
    setFieldErrors([]);
    setSuccessMsg(null);

    // Client-side validations
    const errors = [];
    if (!formData.title.trim()) {
      errors.push('Issue title is required.');
    } else if (formData.title.trim().length < 5 || formData.title.trim().length > 150) {
      errors.push('Issue title must be between 5 and 150 characters.');
    }

    if (!formData.department_id) {
      errors.push('Please select a maintenance department.');
    }

    const fullLocation = `${formData.building}, ${formData.floor}${formData.room_or_spot.trim() ? ` - ${formData.room_or_spot.trim()}` : ''}`;
    if (!fullLocation.trim()) {
      errors.push('Location is required.');
    }

    if (!formData.description.trim()) {
      errors.push('Problem description is required.');
    } else if (formData.description.trim().length < 10 || formData.description.trim().length > 2000) {
      errors.push('Description must be between 10 and 2000 characters.');
    }

    if (!selectedFile) {
      errors.push('An issue photo is required for maintenance proof.');
    }

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('department_id', formData.department_id);
      payload.append('location', fullLocation);
      payload.append('priority', formData.priority);
      payload.append('description', formData.description.trim());
      payload.append('issue_photo', selectedFile);
      const token = localStorage.getItem('campusentry_token');
      if (token) {
        payload.append('token', token);
      }

      const res = await complaintsApi.create(payload);
      if (res.data?.success && res.data?.complaint) {
        const complaint = res.data.complaint;
        setSuccessMsg(`Complaint submitted successfully! Tracking ID: ${complaint.complaint_number}`);
        setTimeout(() => {
          navigate(`/complaints/${complaint.id}`);
        }, 1200);
      } else {
        setFormError(res.data?.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setFieldErrors(err.errors);
      } else {
        setFormError(err.message || 'An unexpected error occurred during submission.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0.5rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div className="card-header" style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="card-title" style={{ fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>
              Report a Campus Issue
            </h1>
            <p className="card-subtitle">
              {COLLEGE_CONFIG.COLLEGE_NAME} &bull; Maintenance Helpdesk
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {(formError || fieldErrors.length > 0) && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-danger-50)',
              border: '1px solid #fecaca',
              color: 'var(--color-danger-700)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: fieldErrors.length ? '0.35rem' : 0 }}>
              <AlertCircle size={16} />
              <span>{formError || 'Please address the following items:'}</span>
            </div>
            {fieldErrors.length > 0 && (
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.825rem' }}>
                {fieldErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-success-50)',
              border: '1px solid #a7f3d0',
              color: 'var(--color-success-700)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Issue Title */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="title" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 0 }}>
                Issue Title <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                {formData.title.length}/150
              </span>
            </div>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. Electrical switch sparking in Lecture Hall 2"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={150}
              required
            />
          </div>

          {/* Department and Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="department_id" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Maintenance Department <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <select
                id="department_id"
                name="department_id"
                className="form-select"
                value={String(formData.department_id)}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#1e293b' }}
                required
              >
                {departments.map(d => (
                  <option key={d.id} value={String(d.id)} style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="priority" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Priority Level <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="Low">Low Priority (General / Non-Urgent)</option>
                <option value="Medium">Medium Priority (Standard Campus Maintenance)</option>
                <option value="High">High Priority (Urgent / Safety / Classroom Disruption)</option>
              </select>
            </div>
          </div>

          {/* Campus Location Matrix: Building, Floor, Room */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--color-slate-200)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={15} color="var(--color-brand-600)" />
              <span>Campus Location Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" htmlFor="building" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Building / Block <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                </label>
                <select
                  id="building"
                  name="building"
                  className="form-select"
                  value={formData.building}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {COLLEGE_CONFIG.CAMPUS_BLOCKS.map((b, i) => (
                    <option key={i} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="floor" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Floor Level <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                </label>
                <select
                  id="floor"
                  name="floor"
                  className="form-select"
                  value={formData.floor}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {COLLEGE_CONFIG.CAMPUS_FLOORS.map((f, i) => (
                    <option key={i} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="room_or_spot" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Room Number / Specific Spot
                </label>
                <input
                  id="room_or_spot"
                  name="room_or_spot"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Room 304, Lab 2, Corridor"
                  value={formData.room_or_spot}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="description" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 0 }}>
                Problem Description <span style={{ color: 'var(--color-danger-600)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                {formData.description.length}/2000
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              rows={4}
              placeholder="Describe the issue clearly so the technician can bring the appropriate tools and spare parts..."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={2000}
              required
            />
          </div>

          {/* Photo Upload with Live Preview */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Upload Problem Photo (Before Repair) <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-slate-300)',
                  borderRadius: '10px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-slate-50)',
                  transition: 'all 0.2s ease',
                }}
              >
                <UploadCloud size={36} color="var(--color-brand-600)" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>
                  Click to upload problem photograph
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                  Supported formats: JPG, PNG, WEBP (Max 5 MB)
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-slate-300)' }}>
                <img
                  src={previewUrl}
                  alt="Problem Preview"
                  style={{ maxHeight: '240px', maxWidth: '100%', display: 'block', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Submitting to Maintenance Queue...</span>
            ) : (
              <>
                <PlusCircle size={18} />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewComplaintPage;
