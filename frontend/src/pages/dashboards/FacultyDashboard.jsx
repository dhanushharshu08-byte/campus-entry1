import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { facultyApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  PlusCircle, 
  MapPin, 
  Eye, 
  ArrowRight,
  RefreshCw,
  Clock,
  FileText,
  School
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { socket, joinUserRoom } = useSocket();
  const [metrics, setMetrics] = useState({
    my_complaints: 0,
    total: 0,
    submitted: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    reopened: 0,
    overdue: 0,
    active: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ensure faculty user joins their private socket room
  useEffect(() => {
    if (user?.id) {
      joinUserRoom(user.id, user.role);
    }
  }, [user, joinUserRoom]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facultyApi.getDashboard();
      if (res.data?.success) {
        setMetrics(res.data.metrics || {});
        setRecentComplaints(res.data.recent_complaints || []);
      }
    } catch (err) {
      console.warn('Error fetching faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time listener for Socket.IO updates across all complaint state changes
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      fetchDashboardData();
    };

    socket.on('complaint:created', handleRealtimeUpdate);
    socket.on('complaint:updated', handleRealtimeUpdate);
    socket.on('complaint:status_changed', handleRealtimeUpdate);
    socket.on('complaint:assigned', handleRealtimeUpdate);
    socket.on('complaint:resolved', handleRealtimeUpdate);
    socket.on('complaint:closed', handleRealtimeUpdate);
    socket.on('complaint:reopened', handleRealtimeUpdate);
    socket.on('notification:new', handleRealtimeUpdate);

    return () => {
      socket.off('complaint:created', handleRealtimeUpdate);
      socket.off('complaint:updated', handleRealtimeUpdate);
      socket.off('complaint:status_changed', handleRealtimeUpdate);
      socket.off('complaint:assigned', handleRealtimeUpdate);
      socket.off('complaint:resolved', handleRealtimeUpdate);
      socket.off('complaint:closed', handleRealtimeUpdate);
      socket.off('complaint:reopened', handleRealtimeUpdate);
      socket.off('notification:new', handleRealtimeUpdate);
    };
  }, [socket, fetchDashboardData]);

  const pendingCount = (metrics.submitted || 0) + (metrics.assigned || 0) + (metrics.reopened || 0);

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.75rem', background: 'linear-gradient(135deg, #0f172a 0%, #2e1065 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(124, 58, 237, 0.25)', color: '#ddd6fe', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              <School size={14} />
              <span>{COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Faculty Priority Desk</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.3rem', fontFamily: "'Outfit', sans-serif" }}>
              Welcome back, {user?.name || 'Faculty Member'}
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
              Report and track campus maintenance issues from one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/complaints/new" className="btn btn-primary" style={{ padding: '0.7rem 1.3rem', fontSize: '0.9rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
              <PlusCircle size={16} />
              <span>Report an Issue</span>
            </Link>
            <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.7rem 1rem' }} title="Refresh">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Statistics Grid (Real SQLite Data) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-card-title">My Complaints</div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>
            {metrics.total || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Pending</div>
          <div className="stat-card-value" style={{ color: '#d97706' }}>
            {pendingCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">In Progress</div>
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>
            {metrics.in_progress || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Resolved</div>
          <div className="stat-card-value" style={{ color: '#059669' }}>
            {metrics.resolved || 0}
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">My Recent Complaints</h2>
            <p className="card-subtitle">Showing recent tickets submitted from departmental locations</p>
          </div>
          <Link to="/complaints" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue</th>
                <th>Department</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.length > 0 ? (
                recentComplaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-brand-700)', fontSize: '0.85rem' }}>
                        {c.complaint_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{c.title}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-700)' }}>{c.department || 'General'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.825rem' }}>
                        <MapPin size={13} color="var(--color-slate-400)" />
                        <span>{c.location}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${(c.priority || 'medium').toLowerCase()}`}>
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
                      <Link to={`/complaints/${c.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>
                        <Eye size={13} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-slate-500)' }}>
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Clock size={16} className="spin" />
                        <span>Loading complaints...</span>
                      </div>
                    ) : (
                      <div>
                        <FileText size={36} color="var(--color-slate-300)" style={{ margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.25rem' }}>
                          No maintenance requests yet
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', marginBottom: '1.25rem' }}>
                          Campus issues reported by you will appear here.
                        </div>
                        <Link to="/complaints/new" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
                          <PlusCircle size={15} />
                          <span>Report an Issue</span>
                        </Link>
                      </div>
                    )}
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

export default FacultyDashboard;
