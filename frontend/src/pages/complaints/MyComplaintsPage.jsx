import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsApi, departmentsApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Eye, 
  RefreshCw, 
  Inbox, 
  Building, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Load departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentsApi.list();
        if (res.data?.success && res.data?.departments) {
          setDepartments(res.data.departments);
        }
      } catch (err) {
        console.warn('Error fetching departments filter:', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch complaints with filters
  const fetchMyComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department_id = deptFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await complaintsApi.list(params);
      if (res.data?.success && Array.isArray(res.data?.complaints)) {
        setComplaints(res.data.complaints);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve grievances.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deptFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
            My Maintenance Grievances
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>
            Track facility maintenance requests submitted by your account
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchMyComplaints}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <Link
            to="/complaints/new"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>Raise New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {/* Search Box */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by ticket number (CH-2026-...), title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search
                size={16}
                color="var(--color-slate-400)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
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
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-danger-50)',
            border: '1px solid #fecaca',
            color: 'var(--color-danger-700)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Grievances List Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Submitted Tickets</h2>
            <p className="card-subtitle">Showing {complaints.length} maintenance grievances</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint No</th>
                <th>Title & Department</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-brand-700)', fontSize: '0.85rem' }}>
                        {c.complaint_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building size={12} />
                        <span>{c.department || 'General'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
                        <MapPin size={13} color="var(--color-slate-400)" />
                        <span>{c.location}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: c.priority === 'High' ? '#dc2626' : c.priority === 'Medium' ? '#b45309' : '#475569'
                        }}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/complaints/${c.id}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                      <Inbox size={42} color="var(--color-slate-300)" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: '0.25rem' }}>
                        {loading ? 'Fetching grievances...' : 'No grievances found'}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)', marginBottom: '1.25rem' }}>
                        {loading ? 'Please wait while we load records' : 'You have not submitted any maintenance grievances matching the filters.'}
                      </div>
                      {!loading && (
                        <Link to="/complaints/new" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          <PlusCircle size={15} />
                          <span>Raise New Grievance</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyComplaintsPage;
