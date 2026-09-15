import React from 'react';
import { 
  FileText, 
  Inbox, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  UserX 
} from 'lucide-react';

const ManagementStats = ({ stats }) => {
  const cards = [
    {
      title: 'TOTAL COMPLAINTS',
      value: stats?.total ?? 0,
      icon: FileText,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe'
    },
    {
      title: 'SUBMITTED',
      value: stats?.submitted ?? 0,
      icon: Inbox,
      color: '#3b82f6',
      bg: '#f0f9ff',
      border: '#bae6fd'
    },
    {
      title: 'ASSIGNED',
      value: stats?.assigned ?? 0,
      icon: UserCheck,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      border: '#ddd6fe'
    },
    {
      title: 'IN PROGRESS',
      value: stats?.in_progress ?? 0,
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a'
    },
    {
      title: 'RESOLVED',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    },
    {
      title: 'CLOSED',
      value: stats?.closed ?? 0,
      icon: ShieldCheck,
      color: '#475569',
      bg: '#f8fafc',
      border: '#cbd5e1'
    },
    {
      title: 'OVERDUE',
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca'
    },
    {
      title: 'UNASSIGNED',
      value: stats?.unassigned ?? 0,
      icon: UserX,
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#ffedd5'
    }
  ];

  return (
    <div className="mgmt-stats-grid mb-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={idx} 
            className="mgmt-stat-card"
            style={{ borderColor: card.border }}
          >
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                <IconComponent size={20} />
              </div>
              <span className="stat-card-title">{card.title}</span>
            </div>
            <div className="stat-card-val" style={{ color: card.color }}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManagementStats;
