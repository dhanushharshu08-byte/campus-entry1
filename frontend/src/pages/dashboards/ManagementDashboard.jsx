import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { managementApi } from '../../services/api';
import ManagementStats from '../../components/management/ManagementStats';
import StatusDistributionChart from '../../components/management/StatusDistributionChart';
import DepartmentPerformance from '../../components/management/DepartmentPerformance';
import ComplaintTrendChart from '../../components/management/ComplaintTrendChart';
import StaffWorkloadChart from '../../components/management/StaffWorkloadChart';
import RecentComplaints from '../../components/management/RecentComplaints';
import LiveActivity from '../../components/management/LiveActivity';
import CreateMaintenanceStaffModal from '../../components/management/CreateMaintenanceStaffModal';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  FileText, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  Sliders, 
  Wrench, 
  Shield,
  Plus,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const ManagementDashboard = () => {
  const { user } = useAuth();
  const { socket, joinUserRoom } = useSocket();

  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activities, setActivities] = useState([]);
  const [slaSummary, setSlaSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffCreatedFeedback, setStaffCreatedFeedback] = useState(null);

  // Join management room
  useEffect(() => {
    if (user?.id) {
      joinUserRoom(user.id, 'management');
    }
  }, [user, joinUserRoom]);

  const loadAllDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [
        statsRes,
        deptsRes,
        trendsRes,
        complaintsRes,
        staffRes,
        activityRes,
        slaRes
      ] = await Promise.allSettled([
        managementApi.getStats(),
        managementApi.getDepartmentPerformance(),
        managementApi.getComplaintTrends(30),
        managementApi.getRecentComplaints(10),
        managementApi.getStaffPerformance(),
        managementApi.getActivity(15),
        managementApi.getSlaAnalytics()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.stats);
      }
      if (deptsRes.status === 'fulfilled' && deptsRes.value.data?.success) {
        setDepartments(deptsRes.value.data.departments || []);
      }
      if (trendsRes.status === 'fulfilled' && trendsRes.value.data?.success) {
        setTrends(trendsRes.value.data.trends || []);
      }
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data?.success) {
        setRecentComplaints(complaintsRes.value.data.complaints || []);
      }
      if (staffRes.status === 'fulfilled' && staffRes.value.data?.success) {
        setStaff(staffRes.value.data.staff || []);
      }
      if (activityRes.status === 'fulfilled' && activityRes.value.data?.success) {
        setActivities(activityRes.value.data.activities || []);
      }
      if (slaRes.status === 'fulfilled' && slaRes.value.data?.success) {
        setSlaSummary(slaRes.value.data.analytics || null);
      }
    } catch (err) {
      console.error('Failed to load management dashboard data:', err);
      setError(err.message || 'Failed to fetch management metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDashboardData();
  }, [loadAllDashboardData]);

  // Socket.IO real-time updates for management
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      loadAllDashboardData();
    };

    socket.on('management:dashboard_update', handleRealtimeUpdate);
    socket.on('notification:new', handleRealtimeUpdate);
    socket.on('complaint:created', handleRealtimeUpdate);
    socket.on('complaint:updated', handleRealtimeUpdate);
    socket.on('complaint:status_changed', handleRealtimeUpdate);
    socket.on('complaint:assigned', handleRealtimeUpdate);
    socket.on('complaint:resolved', handleRealtimeUpdate);
    socket.on('complaint:closed', handleRealtimeUpdate);
    socket.on('complaint:reopened', handleRealtimeUpdate);
    socket.on('complaint:sla_warning', handleRealtimeUpdate);
    socket.on('complaint:sla_breached', handleRealtimeUpdate);
    socket.on('complaint:critical_escalation', handleRealtimeUpdate);

    return () => {
      socket.off('management:dashboard_update', handleRealtimeUpdate);
      socket.off('notification:new', handleRealtimeUpdate);
      socket.off('complaint:created', handleRealtimeUpdate);
      socket.off('complaint:updated', handleRealtimeUpdate);
      socket.off('complaint:status_changed', handleRealtimeUpdate);
      socket.off('complaint:assigned', handleRealtimeUpdate);
      socket.off('complaint:resolved', handleRealtimeUpdate);
      socket.off('complaint:closed', handleRealtimeUpdate);
      socket.off('complaint:reopened', handleRealtimeUpdate);
      socket.off('complaint:sla_warning', handleRealtimeUpdate);
      socket.off('complaint:sla_breached', handleRealtimeUpdate);
      socket.off('complaint:critical_escalation', handleRealtimeUpdate);
    };
  }, [socket, loadAllDashboardData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Clock size={36} className="spin" color="var(--color-brand-600)" />
        <div style={{ color: 'var(--color-slate-600)', fontSize: '0.95rem' }}>Loading campus operations overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger-600)' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 1rem' }} />
        <h2>Unable to load dashboard</h2>
        <p style={{ color: 'var(--color-slate-600)', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button onClick={loadAllDashboardData} className="btn btn-primary">
          <RefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Executive Header Banner */}
      <div 
        className="card" 
        style={{ 
          padding: '2rem', 
          marginBottom: '1.5rem', 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              <Shield size={14} />
              <span>{COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Campus Administration</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.3rem', fontFamily: "'Outfit', sans-serif" }}>
              Campus Operations Overview
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
              {COLLEGE_CONFIG.COLLEGE_NAME} &bull; Executive Maintenance Analytics &amp; Compliance
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link 
              to="/management/complaints" 
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}
            >
              <FileText size={15} />
              <span>All Complaints</span>
            </Link>
            <button 
              onClick={loadAllDashboardData} 
              className="btn btn-secondary" 
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem 1.1rem', fontSize: '0.875rem' }}
              title="Refresh Live Metrics"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical SLA Warning Banner */}
      {stats?.critical_escalations > 0 && (
        <div 
          style={{ 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '10px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={24} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                Action Required: {stats.critical_escalations} Critical Escalations Active
              </div>
              <div style={{ fontSize: '0.825rem', color: '#b91c1c' }}>
                High-priority grievances have exceeded standard response thresholds and require administrative intervention.
              </div>
            </div>
          </div>
          <Link 
            to="/management/overdue" 
            className="btn btn-danger"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem', whiteSpace: 'nowrap' }}
          >
            Review Overdue Queue
          </Link>
        </div>
      )}

      {/* Staff Creation Feedback Alert */}
      {staffCreatedFeedback && (
        <div 
          className="alert alert-success" 
          style={{ 
            marginBottom: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span style={{ fontWeight: 600 }}>{staffCreatedFeedback}</span>
          </div>
          <button 
            type="button" 
            className="alert-close-btn" 
            onClick={() => setStaffCreatedFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#065f46' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <ManagementStats stats={stats} />

      {/* Grid Row 1: Status Distribution & Complaint Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div>
          <StatusDistributionChart stats={stats} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <ComplaintTrendChart trends={trends} />
        </div>
      </div>

      {/* Grid Row 2: Recent Complaints & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <RecentComplaints complaints={recentComplaints} />
        </div>
        <div>
          <LiveActivity activities={activities} />
        </div>
      </div>

      {/* Grid Row 3: Department Performance & Staff Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <DepartmentPerformance departments={departments} />
        </div>
        <div>
          <StaffWorkloadChart staff={staff} />
        </div>
      </div>

      {/* Section 4: Maintenance Staff Management */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem 0' }}>
              <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={18} />
              </div>
              Maintenance Staff Management
            </h2>
            <p style={{ color: 'var(--color-slate-500)', fontSize: '0.85rem', margin: 0 }}>
              Authorized administration for creating maintenance personnel accounts, allocating trade departments, and tracking workload.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            >
              <Plus size={16} />
              <span>Create Maintenance Staff</span>
            </button>
            <Link
              to="/management/staff"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            >
              <Users size={15} />
              <span>Staff Performance</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Staff Table / Summary */}
        <div className="table-container" style={{ margin: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Email Address</th>
                <th style={{ textAlign: 'center' }}>Active Tickets</th>
                <th style={{ textAlign: 'center' }}>In Progress</th>
                <th style={{ textAlign: 'center' }}>Resolved</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff && staff.length > 0 ? (
                staff.slice(0, 6).map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{member.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-assigned" style={{ fontSize: '0.78rem' }}>
                        {member.department || 'General Maintenance'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                        {member.email}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: member.active_complaints >= 5 ? '#dc2626' : 'var(--color-slate-900)' }}>
                      {member.active_complaints}
                    </td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{member.in_progress}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>{member.resolved}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-active" style={{ fontSize: '0.75rem', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-500)' }}>
                    No maintenance staff members found. Click "Create Maintenance Staff" to add technicians.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Maintenance Staff */}
      <CreateMaintenanceStaffModal
        isOpen={showCreateStaffModal}
        onClose={() => setShowCreateStaffModal(false)}
        onSuccess={(createdUser) => {
          setStaffCreatedFeedback(`Maintenance staff account created successfully for ${createdUser.name} (${createdUser.email}).`);
          loadAllDashboardData();
        }}
      />
    </div>
  );
};

export default ManagementDashboard;
