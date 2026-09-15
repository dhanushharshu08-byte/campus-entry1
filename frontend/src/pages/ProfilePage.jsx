import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Save, 
  KeyRound, 
  Eye, 
  EyeOff,
  GraduationCap,
  School,
  Wrench,
  CreditCard,
  Building,
  Calendar
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() });
      if (res.data?.success) {
        setProfileMsg('Profile details updated successfully.');
      } else {
        setProfileError(res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(err.message || 'An error occurred while updating profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      if (res.data?.success) {
        setPasswordMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.data?.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleIcon = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'management':
        return <Shield size={16} color="#2563eb" />;
      case 'maintenance':
        return <Wrench size={16} color="#d97706" />;
      case 'faculty':
        return <School size={16} color="#7c3aed" />;
      default:
        return <GraduationCap size={16} color="#059669" />;
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 0.5rem' }}>
      {/* Header Profile Banner */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', border: 'none', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '2px solid rgba(147, 197, 253, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.6rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              {COLLEGE_CONFIG.COLLEGE_NAME}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem', fontFamily: "'Outfit', sans-serif" }}>
              {user?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#cbd5e1', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textTransform: 'capitalize', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {getRoleIcon(user?.role)}
                <span>{user?.role === 'management' ? 'Campus Admin' : user?.role === 'maintenance' ? 'Maintenance Staff' : user?.role}</span>
              </span>
              <span>&bull;</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Account Details & Edit Profile */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={18} color="var(--color-brand-600)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
              Profile Details
            </h2>
          </div>

          {profileMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--color-success-50)', border: '1px solid #a7f3d0', color: 'var(--color-success-700)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={16} />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--color-danger-50)', border: '1px solid #fecaca', color: 'var(--color-danger-700)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Campus Email</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem', display: 'block' }}>
                Campus email is bound to institutional identity.
              </span>
            </div>

            {user?.employee_or_student_id && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Student / Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={user.employee_or_student_id}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Institution &amp; Campus</label>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-700)', fontWeight: 600 }}>
                {COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.CAMPUS_NAME}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.875rem' }}
              disabled={isUpdatingProfile}
            >
              <Save size={15} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <KeyRound size={18} color="var(--color-brand-600)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
              Change Password
            </h2>
          </div>

          {passwordMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--color-success-50)', border: '1px solid #a7f3d0', color: 'var(--color-success-700)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={16} />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordError && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--color-danger-50)', border: '1px solid #fecaca', color: 'var(--color-danger-700)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
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
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.875rem' }}
              disabled={isChangingPassword}
            >
              <Lock size={15} />
              <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
