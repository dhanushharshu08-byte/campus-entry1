import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { managementApi, departmentsApi } from '../../services/api';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  ArrowUpDown,
  Building,
  User
} from 'lucide-react';

const ManagementComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState(() => 
    (COLLEGE_CONFIG.DEPARTMENTS || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description
    }))
  );
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignment, setAssignment] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.list();
      const depts = res.data?.departments || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(depts) && depts.length > 0) setDepartments(depts);
    } catch (err) {
      console.warn('Failed to load departments:', err);
    }
  };

  const fetchComplaints = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: 15,
        search: search.trim() || undefined,
        department_id: departmentId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assignment: assignment || undefined,
        sort: sort
      };
      const res = await managementApi.getComplaints(params);
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [search, departmentId, status, priority, assignment, sort]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchComplaints(newPage);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            College All Grievances Management
          </h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
            Inspect, filter, and monitor all submitted grievances across college facilities.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
          Total Grievances: <strong style={{ color: 'var(--color-brand-700)' }}>{pagination.total}</strong>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="card mb-4" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
            <input
              type="text"
              placeholder="Search number, title, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Department Filter */}
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }}>
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }}>
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Assignment Filter */}
          <select value={assignment} onChange={(e) => setAssignment(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }}>
            <option value="">All Assignments</option>
            <option value="assigned">Assigned Staff</option>
            <option value="unassigned">Unassigned</option>
          </select>

          {/* Sort Filter */}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-input" style={{ fontSize: '0.85rem' }}>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="priority">Sort: Highest Priority</option>
            <option value="updated">Sort: Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card mb-4">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint No</th>
                <th>Title & Department</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Assigned Staff</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-brand-700)', fontSize: '0.85rem' }}>
                        {c.complaint_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{c.department || 'General'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>{c.location}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.priority === 'High' ? '#dc2626' : c.priority === 'Medium' ? '#b45309' : '#475569' }}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-900)' }}>{c.creator?.name || 'User'}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>{c.creator?.role}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: c.assignee ? 'var(--color-slate-900)' : 'var(--color-slate-400)' }}>
                        {c.assignee?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/management/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                        <Eye size={13} />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading grievances...' : 'No grievances match the selected criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid var(--color-slate-200)' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)' }}>
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total items)
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementComplaints;
