import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { managementApi, departmentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateMaintenanceStaffModal from '../../components/management/CreateMaintenanceStaffModal';
import CreateManagementStaffModal from '../../components/management/CreateManagementStaffModal';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  Wrench, 
  GraduationCap, 
  School, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  KeyRound,
  Edit,
  ArrowRightLeft,
  X,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building,
  Clock
} from 'lucide-react';

const ManagementUsers = ({ defaultTab = 'all' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Active Tab: 'all' or 'management'
  const isMgmtRoute = location.pathname.includes('/management/users/management') || defaultTab === 'management';
  const [activeTab, setActiveTab] = useState(isMgmtRoute ? 'management' : 'all');

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [maintenanceStaff, setMaintenanceStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    department_id: '',
    is_active: '',
    search: ''
  });

  // Modal States
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showAddManagementModal, setShowAddManagementModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [reassigningUser, setReassigningUser] = useState(null);
  const [disablingUser, setDisablingUser] = useState(null);

  // Form States
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    password: '',
    confirm_password: ''
  });

  const [mgmtForm, setMgmtForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });

  const [reassignForm, setReassignForm] = useState({
    new_assigned_to: '',
    reason: '',
    selected_complaint_ids: []
  });

  const [userActiveComplaints, setUserActiveComplaints] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync tab with route changes
  useEffect(() => {
    if (location.pathname.includes('/management/users/management')) {
      setActiveTab('management');
    } else if (location.pathname === '/management/users') {
      setActiveTab('all');
    }
  }, [location.pathname]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'management') {
      navigate('/management/users/management', { replace: true });
    } else {
      navigate('/management/users', { replace: true });
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, deptRes, staffRes] = await Promise.all([
        managementApi.getUsers(filters),
        departmentsApi.list(),
        managementApi.getStaffRoster()
      ]);

      if (usersRes.data?.success) {
        setUsers(usersRes.data.users || []);
      }
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.departments || []);
      }
      if (staffRes.data?.success) {
        setMaintenanceStaff(staffRes.data.staff || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered views
  const managementUsers = users.filter((u) => u.role === 'management');
  const displayedUsers = activeTab === 'management' ? managementUsers : users;

  // -------------------------------------------------------------
  // Add Maintenance Staff
  // -------------------------------------------------------------
  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.department_id || !staffForm.password) {
      alert('Please fill in all required fields.');
      return;
    }
    if (staffForm.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (staffForm.password !== staffForm.confirm_password) {
      alert('Password confirmation does not match.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.createMaintenanceUser(staffForm);
      if (res.data?.success) {
        setFeedback(`Maintenance technician ${res.data.user.name} created successfully.`);
        setShowAddMaintenanceModal(false);
        setStaffForm({ name: '', email: '', phone: '', department_id: '', password: '', confirm_password: '' });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create maintenance staff.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Add Management User
  // -------------------------------------------------------------
  const handleCreateManagement = async (e) => {
    e.preventDefault();
    if (!mgmtForm.name || !mgmtForm.email || !mgmtForm.password) {
      alert('Please fill in all required fields.');
      return;
    }
    if (mgmtForm.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (mgmtForm.password !== mgmtForm.confirm_password) {
      alert('Password confirmation does not match.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.createManagementUser(mgmtForm);
      if (res.data?.success) {
        setFeedback(`Management account for ${res.data.user.name} created successfully.`);
        setShowAddManagementModal(false);
        setMgmtForm({ name: '', email: '', phone: '', password: '', confirm_password: '' });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create management user.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Edit User Details
  // -------------------------------------------------------------
  const openEditModal = async (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      department_id: u.department_id || ''
    });

    if (u.role === 'maintenance') {
      try {
        const res = await managementApi.getUserActiveComplaints(u.id);
        if (res.data?.success) {
          setUserActiveComplaints(res.data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to load active complaints', err);
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setActionLoading(true);
      const res = await managementApi.updateUser(editingUser.id, editForm);
      if (res.data?.success) {
        let msg = res.data.message;
        if (res.data.warning) {
          msg += ` (${res.data.warning})`;
        }
        setFeedback(msg);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user profile.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Change Password
  // -------------------------------------------------------------
  const openPasswordModal = (u) => {
    setPasswordUser(u);
    setPasswordForm({ new_password: '', confirm_password: '' });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('Password confirmation does not match.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.updateUserPassword(passwordUser.id, passwordForm);
      if (res.data?.success) {
        setFeedback(res.data.message);
        setPasswordUser(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Toggle Status (Enable / Disable) with Safety & Reassign Checks
  // -------------------------------------------------------------
  const handleToggleStatus = async (user) => {
    const isDeactivating = user.is_active;

    // Safety rule for management
    if (user.role === 'management' && isDeactivating) {
      const activeMgmt = users.filter((u) => u.role === 'management' && u.is_active);
      if (activeMgmt.length <= 1) {
        alert('At least one active management account must remain.');
        return;
      }
    }

    // If deactivating maintenance staff who has active complaints, prompt modal
    if (user.role === 'maintenance' && isDeactivating && user.active_workload > 0) {
      try {
        const res = await managementApi.getUserActiveComplaints(user.id);
        setUserActiveComplaints(res.data?.complaints || []);
      } catch {
        setUserActiveComplaints([]);
      }
      setDisablingUser(user);
      setReassignForm({ new_assigned_to: '', reason: `Reassignment upon ${user.name}'s deactivation`, selected_complaint_ids: [] });
      return;
    }

    const actionText = isDeactivating ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const res = await managementApi.updateUserStatus(user.id, { is_active: !user.is_active });
      if (res.data?.success) {
        setFeedback(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || `Failed to update status.`);
    }
  };

  // -------------------------------------------------------------
  // Disable & Reassign Active Complaints
  // -------------------------------------------------------------
  const handleDisableAndReassign = async (e) => {
    e.preventDefault();
    if (!disablingUser) return;
    if (!reassignForm.new_assigned_to) {
      alert('Please select a replacement maintenance technician.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.disableAndReassignUser(disablingUser.id, {
        new_assigned_to: reassignForm.new_assigned_to,
        reason: reassignForm.reason || `Staff deactivated (${disablingUser.name})`
      });

      if (res.data?.success) {
        setFeedback(res.data.message);
        setDisablingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to disable and reassign.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableWithoutReassign = async () => {
    if (!disablingUser) return;
    if (!window.confirm(`Disable ${disablingUser.name} leaving their ${userActiveComplaints.length} complaints for manual reassignment?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.updateUserStatus(disablingUser.id, { is_active: false });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setDisablingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to deactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Open Reassign Modal for Active Staff
  // -------------------------------------------------------------
  const openReassignModal = async (u) => {
    setReassigningUser(u);
    try {
      const res = await managementApi.getUserActiveComplaints(u.id);
      const comps = res.data?.complaints || [];
      setUserActiveComplaints(comps);
      setReassignForm({
        new_assigned_to: '',
        reason: `Reassignment from ${u.name}`,
        selected_complaint_ids: comps.map((c) => c.id)
      });
    } catch (err) {
      alert('Failed to load active complaints: ' + err.message);
    }
  };

  const handleExecuteReassignment = async (e) => {
    e.preventDefault();
    if (!reassigningUser) return;
    if (!reassignForm.new_assigned_to) {
      alert('Please select a target maintenance technician.');
      return;
    }
    if (reassignForm.selected_complaint_ids.length === 0) {
      alert('Please select at least one complaint to reassign.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await managementApi.reassignUserComplaints(reassigningUser.id, {
        new_assigned_to: reassignForm.new_assigned_to,
        complaint_ids: reassignForm.selected_complaint_ids,
        reason: reassignForm.reason
      });

      if (res.data?.success) {
        setFeedback(res.data.message);
        setReassigningUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to reassign complaints.');
    } finally {
      setActionLoading(false);
    }
  };

  // Badges & Formatting
  const getRoleBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'management':
        return (
          <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <Shield size={12} /> Management
          </span>
        );
      case 'maintenance':
        return (
          <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
            <Wrench size={12} /> Maintenance
          </span>
        );
      case 'faculty':
        return (
          <span className="badge" style={{ backgroundColor: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
            <School size={12} /> Faculty
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
            <GraduationCap size={12} /> Student
          </span>
        );
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never / N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">User & Account Management</h1>
          <p className="page-subtitle">
            Flexible administration of Management and Maintenance personnel, department assignments, and security credentials.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddMaintenanceModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={15} />
            <span>+ Add Maintenance Staff</span>
          </button>
          <button onClick={() => setShowAddManagementModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={15} color="#2563eb" />
            <span>+ Add Management User</span>
          </button>
          <button onClick={fetchUsers} className="btn btn-secondary" title="Refresh directory">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--color-slate-200)', marginBottom: '1.25rem' }}>
        <button
          onClick={() => handleTabSwitch('all')}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid var(--color-blue-600)' : '2px solid transparent',
            color: activeTab === 'all' ? 'var(--color-blue-600)' : 'var(--color-slate-600)',
            fontWeight: activeTab === 'all' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={16} /> All Directory & Staff ({users.length})
        </button>
        <button
          onClick={() => handleTabSwitch('management')}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'management' ? '2px solid var(--color-blue-600)' : '2px solid transparent',
            color: activeTab === 'management' ? 'var(--color-blue-600)' : 'var(--color-slate-600)',
            fontWeight: activeTab === 'management' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Shield size={16} color={activeTab === 'management' ? '#2563eb' : '#64748b'} /> Management Accounts ({managementUsers.length})
        </button>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
          <button className="alert-close-btn" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar (For All Users Tab) */}
      {activeTab === 'all' && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Name or Email:</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-slate-400)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Search name, email, or ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Role:</label>
              <select
                className="form-control"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="maintenance">Maintenance</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Department:</label>
              <select
                className="form-control"
                value={filters.department_id}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Account Status:</label>
              <select
                className="form-control"
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Deactivated Only</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilters({ role: '', department_id: '', is_active: '', search: '' })}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && displayedUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
            <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Loading users...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '3rem' }}>
            <Users size={42} color="var(--color-slate-300)" />
            <h3>No Accounts Found</h3>
            <p>No user accounts matched your search criteria.</p>
          </div>
        ) : activeTab === 'management' ? (
          /* Dedicated Management Table */
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managementUsers.map((u) => (
                  <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {u.name} {u.id === currentUser?.id && <span style={{ fontSize: '0.75rem', color: 'var(--color-blue-600)' }}>(Current)</span>}
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.85rem' }}>{u.email}</span></td>
                    <td><span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>{u.phone || '—'}</span></td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span className={`status-pill ${u.is_active ? 'status-active' : 'status-disabled'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} color="#64748b" />
                        <span>{formatDate(u.last_login)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          title="Edit Profile"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          title="Change Password"
                        >
                          <KeyRound size={12} /> Password
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.is_active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          <span>{u.is_active ? 'Disable' : 'Enable'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* General Directory & Maintenance Table */
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User & Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Phone / ID</th>
                  <th>Active Workload</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((u) => (
                  <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {u.name} {u.id === currentUser?.id && <span style={{ fontSize: '0.7rem', color: 'var(--color-blue-600)' }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {u.email}
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{u.department || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                      <div>{u.phone || '—'}</div>
                      {u.employee_or_student_id && <div style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)' }}>{u.employee_or_student_id}</div>}
                    </td>
                    <td>
                      {u.role === 'maintenance' ? (
                        <span style={{ fontWeight: 600, color: (u.active_workload || 0) > 0 ? '#b45309' : '#16a34a' }}>
                          {u.active_workload || 0} active tickets
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-slate-400)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${u.is_active ? 'status-active' : 'status-disabled'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                          title="Edit User"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                          title="Change Password"
                        >
                          <KeyRound size={12} /> Pass
                        </button>
                        {u.role === 'maintenance' && (u.active_workload || 0) > 0 && (
                          <button
                            onClick={() => openReassignModal(u)}
                            className="btn btn-warning-outline"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="Reassign Active Tickets"
                          >
                            <ArrowRightLeft size={12} /> Reassign
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn ${u.is_active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                          title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {u.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          <span>{u.is_active ? 'Disable' : 'Enable'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-slate-200)', fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
          Showing {displayedUsers.length} accounts ({users.filter(u => u.is_active).length} active)
        </div>
      </div>

      {/* ============================================================= */}
      {/* 1. Modal: Add Maintenance Staff */}
      {/* ============================================================= */}
      <CreateMaintenanceStaffModal
        isOpen={showAddMaintenanceModal}
        onClose={() => setShowAddMaintenanceModal(false)}
        onSuccess={(createdUser) => {
          setFeedback(`Maintenance staff account created successfully for ${createdUser.name} (${createdUser.email}).`);
          fetchUsers();
        }}
      />

      {/* ============================================================= */}
      {/* 2. Modal: Add Management User */}
      {/* ============================================================= */}
      <CreateManagementStaffModal
        isOpen={showAddManagementModal}
        onClose={() => setShowAddManagementModal(false)}
        onSuccess={(createdUser) => {
          setFeedback(`Management administrator account created successfully for ${createdUser.name} (${createdUser.email}).`);
          fetchUsers();
        }}
      />

      {/* ============================================================= */}
      {/* 3. Modal: Edit User Details */}
      {/* ============================================================= */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={18} /> Edit {editingUser.role === 'management' ? 'Management Account' : 'User Profile'}
              </h3>
              <button className="modal-close-btn" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                {editingUser.role === 'maintenance' && (
                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      required
                      className="form-control"
                      value={editForm.department_id}
                      onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>

                    {/* Department Change Alert */}
                    {editForm.department_id && String(editForm.department_id) !== String(editingUser.department_id) && userActiveComplaints.length > 0 && (
                      <div className="alert alert-warning" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                        <AlertTriangle size={14} />
                        <span>
                          <strong>Notice:</strong> This staff member is currently assigned to {userActiveComplaints.length} active complaint(s) in {editingUser.department}. Changing the department will keep historical records intact, but active complaints may require reassignment.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  User Role: <strong>{editingUser.role}</strong> (Roles cannot be arbitrarily switched).
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. Modal: Change / Reset Password */}
      {/* ============================================================= */}
      {passwordUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} color="#2563eb" /> Reset Password for {passwordUser.name}
              </h3>
              <button className="modal-close-btn" onClick={() => setPasswordUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  Enter a new secure password for <strong>{passwordUser.email}</strong>. Passwords must be at least 8 characters long.
                </p>

                <div>
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-control"
                    placeholder="New password (min 8 chars)"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-control"
                    placeholder="Re-type new password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPasswordUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. Modal: Reassign Active Complaints */}
      {/* ============================================================= */}
      {reassigningUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={18} color="#2563eb" /> Reassign Active Complaints ({reassigningUser.name})
              </h3>
              <button className="modal-close-btn" onClick={() => setReassigningUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteReassignment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  Reassign pending or in-progress tickets to another active maintenance technician.
                </p>

                <div>
                  <label className="form-label">Select Replacement Technician *</label>
                  <select
                    required
                    className="form-control"
                    value={reassignForm.new_assigned_to}
                    onChange={(e) => setReassignForm({ ...reassignForm, new_assigned_to: e.target.value })}
                  >
                    <option value="">Select Technician...</option>
                    {maintenanceStaff
                      .filter((s) => s.id !== reassigningUser.id && s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department} — {s.active_workload || 0} active tickets)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Reassignment Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Technician transferred / workload redistribution"
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Active Tickets to Reassign ({userActiveComplaints.length})
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => {
                        if (reassignForm.selected_complaint_ids.length === userActiveComplaints.length) {
                          setReassignForm({ ...reassignForm, selected_complaint_ids: [] });
                        } else {
                          setReassignForm({ ...reassignForm, selected_complaint_ids: userActiveComplaints.map((c) => c.id) });
                        }
                      }}
                    >
                      {reassignForm.selected_complaint_ids.length === userActiveComplaints.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-slate-200)', borderRadius: '6px', padding: '0.5rem' }}>
                    {userActiveComplaints.map((c) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--color-slate-100)' }}>
                        <input
                          type="checkbox"
                          checked={reassignForm.selected_complaint_ids.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReassignForm({ ...reassignForm, selected_complaint_ids: [...reassignForm.selected_complaint_ids, c.id] });
                            } else {
                              setReassignForm({ ...reassignForm, selected_complaint_ids: reassignForm.selected_complaint_ids.filter((id) => id !== c.id) });
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.complaint_number}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-700)', flex: 1 }}>{c.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-500)' }}>{c.priority}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReassigningUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Reassigning...' : `Reassign (${reassignForm.selected_complaint_ids.length}) Complaints`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. Modal: Disable Maintenance User with Active Complaints */}
      {/* ============================================================= */}
      {disablingUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-red-600)' }}>
                <AlertTriangle size={18} /> Active Complaints on Staff Deactivation
              </h3>
              <button className="modal-close-btn" onClick={() => setDisablingUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDisableAndReassign}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  <span>
                    <strong>{disablingUser.name}</strong> currently has <strong>{userActiveComplaints.length} active complaints</strong> in {disablingUser.department}.
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                  You can reassign all active complaints to a replacement technician right now, or disable the staff member and reassign complaints individually later.
                </p>

                <div>
                  <label className="form-label">Select Replacement Technician *</label>
                  <select
                    required
                    className="form-control"
                    value={reassignForm.new_assigned_to}
                    onChange={(e) => setReassignForm({ ...reassignForm, new_assigned_to: e.target.value })}
                  >
                    <option value="">Select Replacement Technician...</option>
                    {maintenanceStaff
                      .filter((s) => s.id !== disablingUser.id && s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department} — {s.active_workload || 0} active tickets)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Reason / Remarks</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Staff deactivation & ticket transfer"
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDisablingUser(null)}>
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-danger-outline" onClick={handleDisableWithoutReassign} disabled={actionLoading}>
                    Disable Only
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Processing...' : 'Disable & Reassign All'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementUsers;
