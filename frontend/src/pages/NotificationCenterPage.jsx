import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  ShieldAlert, 
  Wrench, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const NotificationCenterPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationsApi.list({ limit: 100 });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time listener for new notifications
  useEffect(() => {
    if (!socket) return;
    const handleNew = () => fetchNotifications();
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket, fetchNotifications]);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id);
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.complaint_id) {
      if (user?.role === 'management') {
        navigate(`/management/complaints/${notif.complaint_id}`);
      } else if (user?.role === 'maintenance') {
        navigate(`/maintenance/complaints/${notif.complaint_id}`);
      } else {
        navigate(`/complaints/${notif.complaint_id}`);
      }
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read;
    if (activeFilter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'sla_breach':
      case 'critical_escalation':
        return <ShieldAlert size={18} color="#dc2626" />;
      case 'sla_warning':
      case 'high_priority':
        return <AlertTriangle size={18} color="#d97706" />;
      case 'complaint_assigned':
        return <Wrench size={18} color="#2563eb" />;
      case 'status_update':
        return <Sparkles size={18} color="#16a34a" />;
      default:
        return <Info size={18} color="#64748b" />;
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">
            Real-time activity alerts, assignment notices, and SLA escalation dispatches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={fetchNotifications} className="btn btn-secondary" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-primary">
              <CheckCheck size={14} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tab-container" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          className={`tab-btn ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`tab-btn ${activeFilter === 'read' ? 'active' : ''}`}
          onClick={() => setActiveFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
            <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Bell size={42} color="var(--color-slate-300)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.25rem' }}>
              You're all caught up
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', margin: 0 }}>
              No new CampuSentry notifications.
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`notification-list-item ${!n.is_read ? 'unread-item' : ''}`}
              >
                <div className="notif-icon-box">
                  {getNotificationIcon(n.type || n.notification_type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: !n.is_read ? 700 : 600, color: 'var(--color-slate-900)' }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      {formatTimestamp(n.created_at)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {n.complaint_id && (
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-brand-600)', fontWeight: 600 }}>
                        Click to view ticket &rarr;
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  {!n.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className="btn btn-icon"
                      title="Mark as Read"
                      style={{ padding: '0.3rem' }}
                    >
                      <Check size={14} color="var(--color-brand-600)" />
                    </button>
                  )}
                  <ChevronRight size={16} color="var(--color-slate-300)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
