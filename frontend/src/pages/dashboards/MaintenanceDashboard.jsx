import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { maintenanceApi, departmentsApi } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  Wrench, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ListFilter, 
  Calendar, 
  MapPin, 
  Eye,
  BellRing,
  Building,
  Zap,
  Droplets,
  Layers,
  Sparkles,
  Wifi,
  Package,
  Play,
  CheckCircle,
  AlertTriangle,
  X,
  UploadCloud,
  HelpCircle
} from 'lucide-react';

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const { socket, joinUserRoom } = useSocket();

  const [stats, setStats] = useState({
    total_complaints: 0,
    submitted: 0,
    new: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    by_department: {}
  });

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComplaintAlert, setNewComplaintAlert] = useState(null);

  // Resolve Modal state
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [resolvingLoading, setResolvingLoading] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // Join User Room & Maintenance Hub
  useEffect(() => {
    if (user?.id) {
      joinUserRoom(user.id, user.role);
    }
  }, [user, joinUserRoom]);

  // Fetch Departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentsApi.list();
        if (res.data?.success) {
          setDepartments(res.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    loadDepartments();
  }, []);

  // Fetch Dashboard Stats (All Departments)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await maintenanceApi.getStats();
      if (res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Complaints List (Filtered)
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (departmentFilter) params.department_id = departmentFilter;
      if (statusFilter) {
        if (statusFilter === 'Overdue') {
          params.overdue = 'true';
        } else {
          params.status = statusFilter;
        }
      }
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await maintenanceApi.getComplaints(params);
      if (res.data && res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance complaints:', err);
      setError(err.message || 'Failed to load maintenance grievances.');
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, statusFilter, priorityFilter, searchQuery]);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchComplaints();
  }, [fetchStats, fetchComplaints]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Real-time Socket.IO Listeners
  useEffect(() => {
    if (!socket) return;
    const handleComplaintCreated = (data) => {
      setNewComplaintAlert({
        complaint_number: data.complaint_number || 'CH-NEW',
        department: data.department || 'General',
        title: data.title || 'New grievance submitted',
        priority: data.priority || 'Medium'
      });
      refreshAll();
    };

    const handleComplaintUpdated = () => {
      refreshAll();
    };

    const handleNotificationNew = (data) => {
      if (data.type === 'complaint_assigned' || data.notification_type === 'complaint_assigned') {
        refreshAll();
      }
    };

    socket.on('maintenance:complaint_created', handleComplaintCreated);
    socket.on('maintenance:complaint_updated', handleComplaintUpdated);
    socket.on('maintenance:complaint_assigned', handleComplaintCreated);
    socket.on('complaint:created', handleComplaintCreated);
    socket.on('complaint:updated', handleComplaintUpdated);
    socket.on('complaint:status_changed', handleComplaintUpdated);
    socket.on('complaint:assigned', handleComplaintUpdated);
    socket.on('complaint:resolved', handleComplaintUpdated);
    socket.on('complaint:closed', handleComplaintUpdated);
    socket.on('complaint:reopened', handleComplaintUpdated);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('maintenance:complaint_created', handleComplaintCreated);
      socket.off('maintenance:complaint_updated', handleComplaintUpdated);
      socket.off('maintenance:complaint_assigned', handleComplaintCreated);
      socket.off('complaint:created', handleComplaintCreated);
      socket.off('complaint:updated', handleComplaintUpdated);
      socket.off('complaint:status_changed', handleComplaintUpdated);
      socket.off('complaint:assigned', handleComplaintUpdated);
      socket.off('complaint:resolved', handleComplaintUpdated);
      socket.off('complaint:closed', handleComplaintUpdated);
      socket.off('complaint:reopened', handleComplaintUpdated);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [socket, refreshAll]);

  // Quick Action: Start Work / In Progress
  const handleStartWork = async (complaintId) => {
    try {
      const res = await maintenanceApi.acceptComplaint(complaintId);
      if (res.data?.success) {
        refreshAll();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start work on complaint.');
    }
  };

  // Open Resolve Modal
  const openResolveModal = (complaint) => {
    setResolvingComplaint(complaint);
    setResolutionRemarks('');
    setResolutionPhoto(null);
    setPhotoPreview(null);
    setResolveError(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;

    if (!resolutionRemarks.trim()) {
      setResolveError('Please provide detailed resolution remarks.');
      return;
    }

    if (!resolutionPhoto) {
      setResolveError('Resolution proof photo is required.');
      return;
    }

    try {
      setResolvingLoading(true);
      setResolveError(null);

      const formData = new FormData();
      formData.append('resolution_remarks', resolutionRemarks.trim());
      formData.append('resolution_photo', resolutionPhoto);

      const res = await maintenanceApi.resolveComplaint(resolvingComplaint.id, formData);
      if (res.data?.success) {
        setResolvingComplaint(null);
        refreshAll();
      }
    } catch (err) {
      setResolveError(err.response?.data?.message || err.message || 'Failed to resolve complaint.');
    } finally {
      setResolvingLoading(false);
    }
  };

  // Helper for Department Icon
  const getDeptIcon = (deptName) => {
    const name = (deptName || '').toLowerCase();
    if (name.includes('elec')) return <Zap size={14} color="#eab308" />;
    if (name.includes('plumb')) return <Droplets size={14} color="#0284c7" />;
    if (name.includes('civil')) return <Layers size={14} color="#8b5cf6" />;
    if (name.includes('clean') || name.includes('house')) return <Sparkles size={14} color="#10b981" />;
    if (name.includes('carp') || name.includes('furn')) return <Package size={14} color="#f97316" />;
    if (name.includes('it') || name.includes('net')) return <Wifi size={14} color="#3b82f6" />;
    return <Building size={14} color="#64748b" />;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard-page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem', border: 'none' }}>
        <div className="dashboard-header-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(217, 119, 6, 0.4)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={26} />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                <span>{COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Central Maintenance Helpdesk</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Maintenance Operations
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.2rem', marginBottom: 0 }}>
                {COLLEGE_CONFIG.COLLEGE_NAME} &bull; Unified Department Job Queue
              </p>
            </div>
          </div>
          <button onClick={refreshAll} className="btn btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem 1rem' }} title="Refresh Dashboard">
            <RefreshCw size={14} className={loading || statsLoading ? 'spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Real-time Alert Notification Toast */}
      {newComplaintAlert && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.85rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BellRing size={20} color="#d97706" />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                🔔 New Maintenance Request: {newComplaintAlert.complaint_number} ({newComplaintAlert.department})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                {newComplaintAlert.title} &bull; Priority: <strong>{newComplaintAlert.priority}</strong>
              </div>
            </div>
          </div>
          <button onClick={() => setNewComplaintAlert(null)} className="alert-close-btn">&times;</button>
        </div>
      )}

      {/* Primary KPI Metric Cards (All Departments) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-title">New Requests</div>
          <div className="stat-card-value" style={{ color: '#0284c7' }}>
            {stats.submitted || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Assigned</div>
          <div className="stat-card-value" style={{ color: '#6366f1' }}>
            {stats.assigned || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">In Progress</div>
          <div className="stat-card-value" style={{ color: '#d97706' }}>
            {stats.in_progress || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Resolved</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>
            {stats.resolved || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Reopened</div>
          <div className="stat-card-value" style={{ color: '#e11d48' }}>
            {stats.reopened || 0}
          </div>
        </div>
      </div>

      {/* Department Summary & Live Breakdown */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building size={16} color="var(--color-blue-600)" />
          <span>Department Filter (All 7 Maintenance Divisions)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.65rem' }}>
          {departments.map((dept) => {
            const count = stats.by_department?.[dept.name] || 0;
            const isSelected = String(departmentFilter) === String(dept.id);
            return (
              <div
                key={dept.id}
                onClick={() => setDepartmentFilter(isSelected ? '' : String(dept.id))}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--color-blue-600)' : '1px solid var(--color-slate-200)',
                  backgroundColor: isSelected ? 'var(--color-blue-50)' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={`Click to filter by ${dept.name}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  {getDeptIcon(dept.name)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-800)' }}>{dept.name}</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  {count} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-slate-400)' }}>tickets</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          {/* Department Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Department:</label>
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Status:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority:</label>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Search:</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-slate-400)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search ticket ID, title, block..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setDepartmentFilter('');
                setStatusFilter('');
                setPriorityFilter('');
                setSearchQuery('');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.55rem' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && complaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
            <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Loading maintenance queue...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--color-slate-500)' }}>
            <FileText size={42} color="var(--color-slate-300)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.25rem' }}>
              No new maintenance requests
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', margin: 0 }}>
              New campus issues will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Issue</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-blue-600)', fontFamily: 'monospace' }}>
                        {c.complaint_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{c.title}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                        {getDeptIcon(c.department?.name || c.department)}
                        <span>{c.department?.name || c.department || 'General'}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-700)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} color="var(--color-slate-400)" />
                        <span>{c.location || 'Campus Location'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-700)', fontWeight: 500 }}>
                        {c.user?.name || 'Campus Member'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                      {formatDate(c.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Link
                          to={`/maintenance/complaints/${c.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          title="View Details"
                        >
                          <Eye size={12} /> View
                        </Link>
                        {c.status !== 'Resolved' && c.status !== 'Closed' && (
                          <>
                            {c.status !== 'In Progress' && (
                              <button
                                onClick={() => handleStartWork(c.id)}
                                className="btn btn-warning-outline"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                title="Start Work"
                              >
                                <Play size={12} /> Accept
                              </button>
                            )}
                            <button
                              onClick={() => openResolveModal(c)}
                              className="btn btn-success-outline"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                              title="Resolve Complaint"
                            >
                              <CheckCircle size={12} /> Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-slate-200)', fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
          Showing {complaints.length} tickets in {COLLEGE_CONFIG.COLLEGE_SHORT_NAME} maintenance queue
        </div>
      </div>

      {/* ============================================================= */}
      {/* Resolve Complaint Modal */}
      {/* ============================================================= */}
      {resolvingComplaint && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.15rem' }}>
                <CheckCircle2 size={18} color="#16a34a" /> Resolve Ticket {resolvingComplaint.complaint_number}
              </h3>
              <button className="modal-close-btn" onClick={() => setResolvingComplaint(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitResolution}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{resolvingComplaint.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>
                    Department: <strong>{resolvingComplaint.department?.name || resolvingComplaint.department}</strong> &bull; Location: {resolvingComplaint.location}
                  </div>
                </div>

                {resolveError && (
                  <div className="alert alert-danger" style={{ fontSize: '0.8rem' }}>
                    <AlertTriangle size={14} />
                    <span>{resolveError}</span>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Resolution Remarks (min 10 chars) *</label>
                  <textarea
                    required
                    minLength={10}
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe the maintenance actions taken, replacement parts, and test results..."
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Resolution Proof Photo (After Repair) *</label>
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="form-input"
                    onChange={handlePhotoChange}
                  />
                  {photoPreview && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                      <img
                        src={photoPreview}
                        alt="Resolution preview"
                        style={{ maxHeight: '140px', borderRadius: '6px', border: '1px solid var(--color-slate-200)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolvingComplaint(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resolvingLoading}>
                  {resolvingLoading ? 'Saving...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
