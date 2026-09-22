import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import { CheckCheck, Check, Bell, X, Wrench, Shield, Info, AlertCircle } from 'lucide-react';

const NotificationPanel = ({ notifications, onClose, onRefresh }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.complaint_id) {
      onClose();
      if (user?.role === 'maintenance') {
        navigate(`/maintenance/complaints/${notif.complaint_id}`);
      } else if (user?.role === 'management') {
        navigate(`/management/complaints/${notif.complaint_id}`);
      } else {
        navigate(`/complaints/${notif.complaint_id}`);
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'complaint_assigned':
        return <Wrench size={16} className="notif-icon assignment" />;
      case 'status_update':
        return <CheckCheck size={16} className="notif-icon success" />;
      case 'unassigned_complaint':
        return <AlertCircle size={16} className="notif-icon warning" />;
      default:
        return <Info size={16} className="notif-icon info" />;
    }
  };

  return (
    <div className="notification-panel-dropdown">
      <div className="notif-panel-header">
        <div className="notif-panel-title">
          <Bell size={16} />
          <span>Notifications</span>
        </div>
        <div className="notif-panel-actions">
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-text-sm"
            title="Mark all as read"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
          <button onClick={onClose} className="btn-close-sm">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="notif-filter-tabs">
        <button
          className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      <div className="notif-list-container">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty-state">
            <Bell size={32} opacity={0.3} />
            <p>No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
            >
              <div className="notif-icon-wrapper">{getNotifIcon(notif.type || notif.notification_type)}</div>
              <div className="notif-content">
                <div className="notif-item-title">{notif.title}</div>
                <div className="notif-item-message">{notif.message}</div>
                <div className="notif-item-time">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                </div>
              </div>
              {!notif.is_read && (
                <button
                  onClick={(e) => handleMarkRead(notif.id, e)}
                  className="mark-single-read-btn"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
