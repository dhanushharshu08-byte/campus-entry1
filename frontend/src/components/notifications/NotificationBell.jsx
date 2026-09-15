import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import NotificationPanel from './NotificationPanel';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res.data && res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  useEffect(() => {
    const handleNewNotification = (data) => {
      setUnreadCount((prev) => prev + 1);
      fetchNotifications();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, fetchNotifications]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePanel = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        onClick={togglePanel}
        className="notification-bell-btn"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setIsOpen(false)}
          onRefresh={refreshAll}
        />
      )}
    </div>
  );
};

export default NotificationBell;
