import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { CampuSentryShield } from '../components/brand/CollegeBrandLogo';
import {
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
  School,
  Wrench,
  ShieldCheck,
  Building2,
  Check,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// Safe local error boundary specifically for the Registration page
class RegisterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Registration page error:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="register-page-container"
          style={{
            maxWidth: '520px',
            margin: '3rem auto',
            padding: '0 1rem',
            textAlign: 'center',
          }}
        >
          <div
            className="card"
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CampuSentryShield size={48} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
              Registration Unavailable
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-600)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Registration page could not be loaded. Please refresh and try again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleRefresh}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Refresh Page
              </button>
              <Link
                to="/"
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const RegisterPageContent = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    employee_or_student_id: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setFieldErrors([]);
  };

  // Live password validation checks
  const isMinLength = formData.password.length >= 8;
  const hasLetterAndNumber = /[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password);
  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const isCollegeEmailValid = !formData.email || COLLEGE_CONFIG.isCollegeEmail(formData.email);

  // Quick Demo Autofill Helper
  const fillSampleData = (targetRole) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setRole(targetRole);
    if (targetRole === 'student') {
      setFormData({
        name: 'Kavitha R',
        department: 'Computer Science and Engineering (CSE)',
        employee_or_student_id: `710121104${randomSuffix}`,
        email: `student.${randomSuffix}@acetcbe.edu.in`,
        phone: '+91 98765 43210',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    } else if (targetRole === 'faculty') {
      setFormData({
        name: 'Dr. Ramesh Kumar',
        department: 'Electronics and Communication Engineering (ECE)',
        employee_or_student_id: `ACET-FAC-${randomSuffix}`,
        email: `faculty.${randomSuffix}@acetcbe.edu.in`,
        phone: '+91 98765 12345',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    }
    setFormError(null);
    setFieldErrors([]);
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'student': return 'Student';
      case 'faculty': return 'Faculty';
      default: return 'Account';
    }
  };

  const getIdLabel = () => {
    switch (role) {
      case 'student': return 'Student Register / Roll Number';
      case 'faculty': return 'Faculty ID / Employee Code';
      default: return 'ID / Code';
    }
  };

  const getIdPlaceholder = () => {
    switch (role) {
      case 'student': return 'e.g. 710121104001';
      case 'faculty': return 'e.g. ACET-FAC-102';
      default: return 'e.g. ID-12345';
    }
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
    const department = formData.department.trim();

    // Client-side validations
    const errors = [];
    if (!trimmedName) {
      errors.push('Full name is required.');
    }
    if (!trimmedEmail) {
      errors.push('Campus email is required.');
    } else if (!COLLEGE_CONFIG.isCollegeEmail(trimmedEmail)) {
      errors.push(COLLEGE_CONFIG.OFFICIAL_EMAIL_ERROR_MSG);
    }
    if (!formData.password) {
      errors.push('Password is required.');
    } else if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!formData.confirmPassword) {
      errors.push('Please confirm your password.');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match. Please re-enter your password.');
    }

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
        department: department || undefined,
        employee_or_student_id: studentOrEmpId || undefined,
        phone: phone || undefined,
      };

      const result = await register(payload);
      if (result.success) {
        setSuccessMsg(`Registration successful as ${getRoleTitle()}! Redirecting to dashboard...`);
        const targetRoute = result.redirect || getDashboardRoute(role);
        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 1000);
      } else {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          setFieldErrors(result.errors);
        } else {
          setFormError(result.error || 'Registration failed.');
        }
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        setFieldErrors(err.errors);
      } else {
        setFormError(err.message || 'An error occurred during registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="register-page-container"
      style={{
        maxWidth: '580px',
        margin: '1.5rem auto 3rem',
        padding: '0 1rem',
        position: 'relative',
        zIndex: 2
      }}
    >
      <div
        className="card"
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <CampuSentryShield size={48} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.25rem', fontFamily: "'Outfit', sans-serif" }}>
            Create Helpdesk Account
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', margin: 0 }}>
            {COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.PROJECT_NAME}
          </p>
        </div>

        {/* Quick Demo Autofill Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            marginBottom: '1.25rem',
            padding: '0.45rem 0.6rem',
            background: 'var(--color-brand-50)',
            borderRadius: '8px',
            border: '1px solid var(--color-brand-100)',
            fontSize: '0.76rem'
          }}
        >
          <span style={{ color: 'var(--color-brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={13} /> Quick Fill:
          </span>
          <button
            type="button"
            onClick={() => fillSampleData('student')}
            style={{
              background: '#fff',
              border: '1px solid var(--color-brand-200)',
              color: 'var(--color-brand-700)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => fillSampleData('faculty')}
            style={{
              background: '#fff',
              border: '1px solid var(--color-brand-200)',
              color: 'var(--color-brand-700)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Faculty
          </button>
        </div>

        {/* Role Selection Tabs (Student and Faculty can self-register; staff accounts are issued by admin) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {/* Student */}
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'student' ? '#059669' : 'var(--color-slate-200)'}`,
              background: role === 'student' ? '#05966912' : '#fff',
              color: role === 'student' ? '#059669' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.2rem',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <GraduationCap size={16} color={role === 'student' ? '#059669' : 'var(--color-slate-500)'} />
              <span>Student Account</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--color-slate-500)', lineHeight: 1.25 }}>
              Hostels, labs & classrooms
            </span>
          </button>

          {/* Faculty */}
          <button
            type="button"
            onClick={() => setRole('faculty')}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'faculty' ? '#7c3aed' : 'var(--color-slate-200)'}`,
              background: role === 'faculty' ? '#7c3aed12' : '#fff',
              color: role === 'faculty' ? '#7c3aed' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.2rem',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <School size={16} color={role === 'faculty' ? '#7c3aed' : 'var(--color-slate-500)'} />
              <span>Faculty Account</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--color-slate-500)', lineHeight: 1.25 }}>
              Staff rooms & dept labs
            </span>
          </button>

          {/* Maintenance */}
          <button
            type="button"
            onClick={() => setRole('maintenance')}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'maintenance' ? '#d97706' : 'var(--color-slate-200)'}`,
              background: role === 'maintenance' ? '#d9770612' : '#fff',
              color: role === 'maintenance' ? '#d97706' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.2rem',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wrench size={16} color={role === 'maintenance' ? '#d97706' : 'var(--color-slate-500)'} />
              <span>Maintenance Staff</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--color-slate-500)', lineHeight: 1.25 }}>
              Repairs & resolution desk
            </span>
          </button>

          {/* Management */}
          <button
            type="button"
            onClick={() => setRole('management')}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'management' ? '#2563eb' : 'var(--color-slate-200)'}`,
              background: role === 'management' ? '#2563eb12' : '#fff',
              color: role === 'management' ? '#2563eb' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.2rem',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color={role === 'management' ? '#2563eb' : 'var(--color-slate-500)'} />
              <span>Admin / Management</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--color-slate-500)', lineHeight: 1.25 }}>
              Estate oversight & controls
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {(formError || fieldErrors.length > 0) && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--color-danger-50)',
              border: '1px solid #fecaca',
              color: 'var(--color-danger-700)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: fieldErrors.length > 0 ? '0.35rem' : 0 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError || 'Please address the following errors:'}</span>
            </div>
            {fieldErrors.length > 0 && (
              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                {fieldErrors.map((err, idx) => (
                  <li key={idx} style={{ marginTop: '0.15rem' }}>{err}</li>
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
              borderRadius: '10px',
              backgroundColor: 'var(--color-success-50)',
              border: '1px solid #a7f3d0',
              color: 'var(--color-success-700)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
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
                placeholder={
                  role === 'student' ? 'e.g. Kavitha R' :
                  role === 'faculty' ? 'e.g. Dr. Ramesh Kumar' :
                  role === 'maintenance' ? 'e.g. Suresh Kumar (Technician)' :
                  'e.g. Campus Administrator'
                }
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

          {/* Department */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="department" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {role === 'maintenance' ? 'Maintenance Discipline / Department' : 'Department'}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ paddingLeft: '2.5rem' }}
              >
                <option value="">
                  {role === 'maintenance' ? 'Select Maintenance Discipline (e.g. Electrical, Plumbing)' : 'Select Department (Optional)'}
                </option>
                {role === 'maintenance' ? (
                  <>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Civil & Infrastructure">Civil & Infrastructure</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                    <option value="IT / Network Infrastructure">IT / Network Infrastructure</option>
                  </>
                ) : (
                  COLLEGE_CONFIG.ACADEMIC_DEPARTMENTS?.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))
                )}
              </select>
              <Building2
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Student/Faculty/Staff ID */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="employee_or_student_id" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {getIdLabel()}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="employee_or_student_id"
                name="employee_or_student_id"
                type="text"
                className="form-input"
                placeholder={getIdPlaceholder()}
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

          {/* Official Email */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="email" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Official Campus Email <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder={
                  role === 'student' ? 'e.g. 710121104001@acetcbe.edu.in' :
                  role === 'faculty' ? 'e.g. dr.ramesh@acetcbe.edu.in' :
                  role === 'maintenance' ? 'e.g. technician@college.edu' :
                  'e.g. administrator@college.edu'
                }
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  paddingLeft: '2.5rem',
                  borderColor: formData.email && !isCollegeEmailValid ? 'var(--color-danger-600)' : undefined
                }}
                required
              />
              <Mail
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: formData.email && !isCollegeEmailValid ? 'var(--color-danger-600)' : 'var(--color-slate-500)', marginTop: '0.35rem' }}>
              Accepted domains: <strong>@{COLLEGE_CONFIG.OFFICIAL_EMAIL_DOMAIN}</strong> or <strong>@college.edu</strong>
            </div>
          </div>

          {/* Contact Phone */}
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
              Password <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a secure password (min. 8 characters)"
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

            {/* Password Requirement Indicators */}
            {formData.password && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.73rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isMinLength ? 'var(--color-success-600)' : 'var(--color-slate-500)' }}>
                  {isMinLength ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor', display: 'inline-block' }} />}
                  8+ characters
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: hasLetterAndNumber ? 'var(--color-success-600)' : 'var(--color-slate-500)' }}>
                  {hasLetterAndNumber ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor', display: 'inline-block' }} />}
                  Letters & numbers
                </span>
              </div>
            )}
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
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter password to confirm"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                  borderColor: formData.confirmPassword && !passwordsMatch ? 'var(--color-danger-600)' : undefined
                }}
                required
              />
              <Lock
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                aria-label="Toggle confirm password"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div style={{ fontSize: '0.73rem', marginTop: '0.35rem', color: passwordsMatch ? 'var(--color-success-600)' : 'var(--color-danger-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {passwordsMatch ? (
                  <>
                    <Check size={13} strokeWidth={3} /> Passwords match perfectly
                  </>
                ) : (
                  <>
                    <X size={13} strokeWidth={3} /> Passwords do not match yet
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.98rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Registering Account...</span>
            ) : (
              <>
                <span>Complete {getRoleTitle()} Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-slate-600)', paddingTop: '0.5rem', borderTop: '1px solid var(--color-slate-100)' }}>
          Already have a campus account?{' '}
          <Link to="/login" style={{ color: 'var(--color-brand-600)', fontWeight: 700 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = () => (
  <RegisterErrorBoundary>
    <RegisterPageContent />
  </RegisterErrorBoundary>
);

export default RegisterPage;
