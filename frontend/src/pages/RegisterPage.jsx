import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { CampuSentryShield } from '../components/brand/CollegeBrandLogo';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  CreditCard, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  GraduationCap, 
  School 
} from 'lucide-react';

const RegisterPage = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    employee_or_student_id: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setFieldErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setSuccessMsg(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const studentOrEmpId = formData.employee_or_student_id.trim();
    const phone = formData.phone.trim();

    // Client-side validations
    const errors = [];
    if (!trimmedName) errors.push('Full name is required.');
    if (!trimmedEmail) {
      errors.push('Campus email is required.');
    } else if (!COLLEGE_CONFIG.isCollegeEmail(trimmedEmail)) {
      errors.push(COLLEGE_CONFIG.OFFICIAL_EMAIL_ERROR_MSG);
    }
    if (!formData.password) errors.push('Password is required.');
    else if (formData.password.length < 8) errors.push('Password must be at least 8 characters long.');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match.');

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        role: role,
        employee_or_student_id: studentOrEmpId || undefined,
        phone: phone || undefined,
      };

      const res = await authApi.register(payload);
      if (res.data?.success) {
        setSuccessMsg('Registration successful! Redirecting to sign in page...');
        setTimeout(() => {
          navigate('/login', { state: { registeredEmail: trimmedEmail } });
        }, 1200);
      } else {
        setFormError(res.data?.message || 'Registration failed.');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setFieldErrors(err.errors);
      } else {
        setFormError(err.message || 'An error occurred during registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <CampuSentryShield size={44} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.2rem', fontFamily: "'Outfit', sans-serif" }}>
            Register for {COLLEGE_CONFIG.PROJECT_NAME}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', margin: 0 }}>
            {COLLEGE_CONFIG.COLLEGE_NAME} &bull; Helpdesk Account
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: `2px solid ${role === 'student' ? 'var(--color-brand-600)' : 'var(--color-slate-200)'}`,
              background: role === 'student' ? 'var(--color-brand-50)' : '#fff',
              color: role === 'student' ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <GraduationCap size={18} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('faculty')}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: `2px solid ${role === 'faculty' ? 'var(--color-brand-600)' : 'var(--color-slate-200)'}`,
              background: role === 'faculty' ? 'var(--color-brand-50)' : '#fff',
              color: role === 'faculty' ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <School size={18} />
            <span>Faculty</span>
          </button>
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
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: fieldErrors.length > 0 ? '0.35rem' : 0 }}>
              <AlertCircle size={16} />
              <span>{formError || 'Please address the following errors:'}</span>
            </div>
            {fieldErrors.length > 0 && (
              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
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
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="name" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Full Name <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder={role === 'student' ? 'e.g. John Doe' : 'e.g. Prof. Sarah Smith'}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <User
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Student/Faculty ID */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="employee_or_student_id" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {role === 'student' ? 'Student Register / Roll Number' : 'Faculty ID / Employee Code'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="employee_or_student_id"
                name="employee_or_student_id"
                type="text"
                className="form-input"
                placeholder={role === 'student' ? 'e.g. 710121104001' : 'e.g. ACET-FAC-102'}
                value={formData.employee_or_student_id}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
              />
              <CreditCard
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="email" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Official College Email <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder={role === 'student' ? 'e.g. rollno@acetcbe.edu.in' : 'e.g. facultyname@acetcbe.edu.in'}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.35rem' }}>
              Official college email required (ending with <strong>@{COLLEGE_CONFIG.OFFICIAL_EMAIL_DOMAIN}</strong>)
            </div>
          </div>

          {/* Phone */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="phone" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Contact Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Phone
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="password" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Password (min. 8 characters) <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <Lock
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-slate-400)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="confirmPassword" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Confirm Password <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Lock
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
