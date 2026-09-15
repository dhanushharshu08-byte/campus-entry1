import React, { useState, useEffect } from 'react';
import { dashboardApi, complaintsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Users, 
  Wrench, 
  RefreshCw, 
  MapPin, 
  Calendar 
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        dashboardApi.getStats(),
        complaintsApi.list(),
      ]);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
            Helpdesk & Maintenance Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>
            Real-time status of campus facilities grievances and maintenance dispatch
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
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

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Inbox size={22} />
          </div>
          <div>
            <div className="stat-value">{stats ? stats.total_complaints : '--'}</div>
            <div className="stat-label">Total Grievances</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{stats ? stats.in_progress_count : '--'}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{stats ? stats.resolved_count : '--'}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value">{stats ? stats.urgent_count : '--'}</div>
            <div className="stat-label">Urgent Issues</div>
          </div>
        </div>
      </div>

      {/* Recent Grievances Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Maintenance Tickets</h2>
            <p className="card-subtitle">Showing recent tickets submitted to the helpdesk</p>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
            Total: {complaints.length} tickets
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title & Category</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reported By</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-brand-700)' }}>
                        {c.ticket_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {c.category}
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
                          color: c.priority === 'Urgent' || c.priority === 'High' ? '#dc2626' : '#475569'
                        }}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                        {c.created_by?.username || 'User #' + c.created_by_id}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-500)' }}>
                    {loading ? 'Loading grievances...' : 'No complaints recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      {stats && stats.category_counts && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Category Distribution</h2>
            <p className="card-subtitle">Active breakdown of tickets by maintenance domain</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {Object.entries(stats.category_counts).map(([cat, count]) => (
              <div
                key={cat}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-slate-50)',
                  border: '1px solid var(--color-slate-200)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-slate-600)', marginTop: '0.2rem' }}>
                  {cat}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
