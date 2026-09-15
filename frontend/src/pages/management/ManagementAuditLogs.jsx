import React, { useState, useEffect, useCallback } from 'react';
import { managementApi } from '../../services/api';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  User, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  FileText
} from 'lucide-react';

const ManagementAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 20,
        ...filters
      };
      // Clean empty keys
      Object.keys(params).forEach(k => {
        if (!params[k]) delete params[k];
      });

      const res = await managementApi.getAuditLogs(params);
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      date_from: '',
      date_to: '',
      search: ''
    });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getActionBadgeColor = (action) => {
    const a = (action || '').toLowerCase();
    if (a.includes('login') || a.includes('register')) return 'color-info';
    if (a.includes('status') || a.includes('reopened') || a.includes('resolved') || a.includes('closed')) return 'color-success';
    if (a.includes('deactivated') || a.includes('failed') || a.includes('blocked')) return 'color-danger';
    if (a.includes('reassigned') || a.includes('priority') || a.includes('setting')) return 'color-warning';
    return 'color-primary';
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Security & System Audit Logs</h1>
          <p className="page-subtitle">
            Immutable transaction history of user logins, ticket assignments, status changes, and configuration updates.
          </p>
        </div>
        <button onClick={() => fetchLogs(pagination.page)} className="btn btn-secondary" title="Refresh logs">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Keywords:</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-slate-400)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2rem' }}
                placeholder="User, action, entity..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Entity Type:</label>
            <select
              className="form-control"
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="Complaint">Complaint</option>
              <option value="User">User / Staff</option>
              <option value="Department">Department</option>
              <option value="SystemSetting">System Setting</option>
              <option value="Auth">Authentication</option>
              <option value="Database">Database Backup</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date From:</label>
            <input
              type="date"
              className="form-control"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date To:</label>
            <input
              type="date"
              className="form-control"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>

          <div>
            <button onClick={handleResetFilters} className="btn btn-secondary" style={{ width: '100%' }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
            <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Loading audit log records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '3rem' }}>
            <FileText size={42} color="var(--color-slate-300)" />
            <h3>No Audit Logs Found</h3>
            <p>No transactions match your current search and filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details & State Change</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--color-slate-600)' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-slate-900)' }}>
                        {log.user_name || 'System'}
                      </div>
                      {log.user?.role && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-500)', textTransform: 'capitalize' }}>
                          {log.user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`audit-badge ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      {log.entity_type}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                      {log.entity_id || '—'}
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '0.8rem' }}>
                      {log.old_value && (
                        <div style={{ color: '#dc2626', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600 }}>Previous:</span> {log.old_value}
                        </div>
                      )}
                      {log.new_value && (
                        <div style={{ color: '#16a34a' }}>
                          <span style={{ fontWeight: 600 }}>Updated:</span> {log.new_value}
                        </div>
                      )}
                      {!log.old_value && !log.new_value && <span style={{ color: 'var(--color-slate-400)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-slate-500)' }}>
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-slate-200)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
            Showing page {pagination.page} of {pagination.total_pages || 1} ({pagination.total} total audit records)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementAuditLogs;
