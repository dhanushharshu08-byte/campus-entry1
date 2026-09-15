import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
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
  Building2,
  Check,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const RegisterPage = () => {
  const { user, getDashboardRoute } = useAuth();
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

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.role) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

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
    } else {
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
    if (!trimmedName) errors.push('Full name is required.');
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
    if (formData.password !== formData.confirmPassword) {
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

      const res = await authApi.register(payload);
      if (res.data?.success) {
        setSuccessMsg(`Registration successful! Account created for ${trimmedName}. Redirecting to login...`);
        setTimeout(() => {
          navigate('/login', { state: { registeredEmail: trimmedEmail } });
        }, 1500);
      } else {
        setFormError(res.data?.message || 'Registration failed.');
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
        maxWidth: '560px', 
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
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            marginBottom: '1.25rem',
            padding: '0.45rem 0.75rem',
            background: 'var(--color-brand-50)',
            borderRadius: '8px',
            border: '1px solid var(--color-brand-100)',
            fontSize: '0.78rem'
          }}
        >
          <span style={{ color: 'var(--color-brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={14} /> Quick Demo:
          </span>
          <button
            type="button"
            onClick={() => fillSampleData('student')}
            style={{
              background: '#fff',
              border: '1px solid var(--color-brand-200)',
              color: 'var(--color-brand-700)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fill Student
          </button>
          <button
            type="button"
            onClick={() => fillSampleData('faculty')}
            style={{
              background: '#fff',
              border: '1px solid var(--color-brand-200)',
              color: 'var(--color-brand-700)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fill Faculty
          </button>
        </div>

        {/* Role Selection Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.85rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'student' ? 'var(--color-brand-600)' : 'var(--color-slate-200)'}`,
              background: role === 'student' ? 'var(--color-brand-50)' : '#fff',
              color: role === 'student' ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
              boxShadow: role === 'student' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GraduationCap size={20} />
              <span>Student Account</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: role === 'student' ? 'var(--color-brand-600)' : 'var(--color-slate-500)' }}>
              Report classroom, lab, hostel issues
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole('faculty')}
            style={{
              padding: '0.85rem',
              borderRadius: '10px',
              border: `2px solid ${role === 'faculty' ? 'var(--color-brand-600)' : 'var(--color-slate-200)'}`,
              background: role === 'faculty' ? 'var(--color-brand-50)' : '#fff',
              color: role === 'faculty' ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
              boxShadow: role === 'faculty' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <School size={20} />
              <span>Faculty Account</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: role === 'faculty' ? 'var(--color-brand-600)' : 'var(--color-slate-500)' }}>
              Staff rooms, labs, department requests
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
                placeholder={role === 'student' ? 'e.g. Kavitha R' : 'e.g. Dr. Ramesh Kumar'}
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

          {/* Academic Department */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" htmlFor="department" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Academic Department
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
                <option value="">Select Academic Department (Optional)</option>
                {COLLEGE_CONFIG.ACADEMIC_DEPARTMENTS?.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
              <Building2
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
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

          {/* Official Email */}
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
                placeholder={role === 'student' ? 'e.g. 710121104001@acetcbe.edu.in' : 'e.g. dr.ramesh@acetcbe.edu.in'}
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
              Accepted domain: <strong>@{COLLEGE_CONFIG.OFFICIAL_EMAIL_DOMAIN}</strong> (or @college.edu)
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
                <span>Complete {role === 'student' ? 'Student' : 'Faculty'} Registration</span>
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

export default RegisterPage;
