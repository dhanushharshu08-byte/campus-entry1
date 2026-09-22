import React, { useState, useEffect } from 'react';
import { managementApi, departmentsApi } from '../../services/api';
import { Wrench, X, AlertCircle, CheckCircle2, Lock, Mail, Phone, User as UserIcon, Building } from 'lucide-react';

const CreateMaintenanceStaffModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    password: '',
    confirm_password: '',
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset form states on open
    setFormData({
      name: '',
      email: '',
      phone: '',
      department_id: '',
      password: '',
      confirm_password: '',
    });
    setErrorMessage(null);

    // Fetch active departments for selection
    const fetchDepartments = async () => {
      setLoadingDepts(true);
      try {
        const res = await departmentsApi.list();
        if (res.data?.success && Array.isArray(res.data.departments)) {
          setDepartments(res.data.departments);
          if (res.data.departments.length > 0) {
            setFormData(prev => ({ ...prev, department_id: prev.department_id || res.data.departments[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments for maintenance staff form:', err);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
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
    const deptId = formData.department_id;
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    // Client-side validations
    if (!trimmedName) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!deptId) {
      setErrorMessage('Please select an assigned maintenance department.');
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
      setErrorMessage('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await managementApi.createMaintenanceUser({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        department_id: deptId,
        password: password,
        confirm_password: confirmPassword,
      });

      if (res.data?.success) {
        if (onSuccess) {
          onSuccess(res.data.user || { name: trimmedName, email: trimmedEmail });
        }
        onClose();
      } else {
        setErrorMessage(res.data?.message || 'Failed to create maintenance staff account.');
      }
    } catch (err) {
      console.error('Create maintenance staff error:', err);
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
            <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={18} />
            </div>
            Create Maintenance Staff Account
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
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
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
                  placeholder="e.g. Ramesh Kumar (Electrician)"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                <input
                  type="email"
                  name="email"
                  required
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. ramesh.maintenance@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                This email will be used for Maintenance portal login and complaint assignments.
              </div>
            </div>

            {/* Department & Contact Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Assigned Department <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)', pointerEvents: 'none' }} />
                  <select
                    name="department_id"
                    required
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    value={formData.department_id}
                    onChange={handleChange}
                    disabled={submitting || loadingDepts}
                  >
                    <option value="">{loadingDepts ? 'Loading departments...' : 'Select Department...'}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Contact Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Password (min 8 chars) <span style={{ color: '#dc2626' }}>*</span>
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
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
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Role / System Notice */}
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569' }}>
              <strong>Access Level:</strong> The account will automatically be created with the <code>maintenance</code> role and immediate access to the Maintenance Operations dashboard.
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-slate-200)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              <Wrench size={15} />
              <span>{submitting ? 'Creating Account...' : 'Create Maintenance Staff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMaintenanceStaffModal;
