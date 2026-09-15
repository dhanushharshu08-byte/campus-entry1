import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationToast = () => {
  const { socket } = useSocket();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewNotification = (data) => {
      if (!data) return;
      const newToast = {
        id: Date.now() + Math.random(),
        title: data.title || 'New Notification',
        message: data.message || '',
        type: data.type || data.notification_type || 'info',
        complaint_id: data.complaint_id,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'complaint_assigned':
        return <Bell size={18} className="toast-icon assignment" />;
      case 'status_update':
        return <CheckCircle size={18} className="toast-icon success" />;
      case 'unassigned_complaint':
        return <AlertTriangle size={18} className="toast-icon warning" />;
      default:
        return <Info size={18} className="toast-icon info" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="notification-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`notification-toast ${t.type}`}>
          <div className="toast-header">
            <div className="toast-title-row">
              {getIcon(t.type)}
              <span className="toast-title">{t.title}</span>
            </div>
            <button onClick={() => removeToast(t.id)} className="toast-close" title="Dismiss">
              <X size={14} />
            </button>
          </div>
          <div className="toast-message">{t.message}</div>
          <div className="toast-time">{t.created_at}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
