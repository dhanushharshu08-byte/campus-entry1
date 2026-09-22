import React, { useState, useEffect } from 'react';
import { managementApi } from '../../services/api';
import { Shield, X, AlertCircle, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';

const CreateManagementStaffModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset form state on open
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    });
    setErrorMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    if (!trimmedName) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!confirmPassword) {
      setErrorMessage('Please confirm the password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await managementApi.createManagementUser({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: password,
        confirm_password: confirmPassword,
      });

      if (res.data?.success) {
        if (onSuccess) {
          onSuccess(res.data.user || { name: trimmedName, email: trimmedEmail });
        }
        onClose();
      } else {
        setErrorMessage(res.data?.message || 'Failed to create management account.');
      }
    } catch (err) {
      console.error('Create management account error:', err);
      setErrorMessage(err.message || err.response?.data?.message || err.data?.message || 'An unexpected error occurred while creating the account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '540px', width: '90%', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-slate-900)' }}>
            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} />
            </div>
            Create Management Administrator Account
          </h3>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose} 
            disabled={submitting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {errorMessage && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                <input
                  type="text"
                  name="name"
                  required
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. Dr. Robert Vance"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                Official College Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                <input
                  type="email"
                  name="email"
                  required
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. dean.admin@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <small style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                This email address will be used to log in and receive administrative alerts.
              </small>
            </div>

            {/* Phone */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                Contact Phone Number (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  Temporary Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                  <input
                    type="password"
                    name="confirm_password"
                    required
                    minLength={8}
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Confirm password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#1e40af' }}>
              <strong>Administrator Access:</strong> This account is assigned the <strong>management</strong> role with full institutional governance authority, compliance reporting, and user administration permissions.
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Shield size={15} />
              <span>{submitting ? 'Creating Administrator...' : 'Create Management Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManagementStaffModal;
