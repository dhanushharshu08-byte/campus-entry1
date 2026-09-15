import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { 
  Radio, 
  Zap, 
  Wrench, 
  Wifi, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Sparkles, 
  Layers
} from 'lucide-react';

const getDepartmentIcon = (dept) => {
  const d = (dept || '').toLowerCase();
  if (d.includes('elect')) return Zap;
  if (d.includes('plumb')) return Wrench;
  if (d.includes('it') || d.includes('net')) return Wifi;
  if (d.includes('civil') || d.includes('struct')) return Building2;
  return Layers;
};

const getDepartmentColor = (dept) => {
  const d = (dept || '').toLowerCase();
  if (d.includes('elect')) return '#eab308';
  if (d.includes('plumb')) return '#0284c7';
  if (d.includes('it') || d.includes('net')) return '#8b5cf6';
  if (d.includes('civil') || d.includes('struct')) return '#ea580c';
  return '#2563eb';
};

const LiveIncidentRadar = () => {
  const [events, setEvents] = useState([]);
  const [filterDept, setFilterDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchRecentEvents = async () => {
    try {
      const res = await axios.get('/api/complaints/public/recent');
      if (res.data?.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      }
    } catch (err) {
      // Graceful fallback on network glitch
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEvents();
  }, []);

  // Real-time WebSocket listener
  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = () => {
      fetchRecentEvents();
    };

    socket.on('complaint:created', handleNewEvent);
    socket.on('complaint:updated', handleNewEvent);
    socket.on('complaint:status_changed', handleNewEvent);
    socket.on('complaint:resolved', handleNewEvent);

    return () => {
      socket.off('complaint:created', handleNewEvent);
      socket.off('complaint:updated', handleNewEvent);
      socket.off('complaint:status_changed', handleNewEvent);
      socket.off('complaint:resolved', handleNewEvent);
    };
  }, [socket]);

  const filtered = filterDept === 'All' 
    ? events 
    : events.filter(e => (e.department || '').toLowerCase().includes(filterDept.toLowerCase()));

  return (
    <div className="incident-radar-container">
      <div className="radar-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="radar-pulse-badge">
            <span className="pulse-wave" />
            <Radio size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
              Live Telemetry & Workload Stream
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
              Real-time maintenance floor telemetry computed from actual facilities records
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="radar-filter-group">
          {['All', 'Electrical', 'Plumbing', 'IT / Network', 'Civil'].map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setFilterDept(dept)}
              className={`radar-filter-btn ${filterDept === dept ? 'active' : ''}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="radar-stream-list">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
            <Clock size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
            Loading recent maintenance activity...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
            <CheckCircle2 size={24} color="var(--color-brand-600)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', marginBottom: '0.2rem' }}>
              No Active Incidents in Stream
            </div>
            <div>All campus infrastructure systems are operating normally.</div>
          </div>
        ) : (
          filtered.map((evt) => {
            const EvtIcon = getDepartmentIcon(evt.department);
            const deptColor = getDepartmentColor(evt.department);
            return (
              <div key={evt.id} className="radar-event-card">
                <div className="event-icon-box" style={{ color: deptColor }}>
                  <EvtIcon size={16} />
                </div>

                <div className="event-body-main">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="event-ticket-no">{evt.ticket}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                        {evt.title}
                      </span>
                    </div>
                    <span className="event-time-tag">{evt.priority} Priority</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
                    <span>Department: <strong style={{ color: 'var(--color-slate-700)' }}>{evt.department}</strong> &bull; {evt.location}</span>
                    <span className={`status-pill status-${(evt.status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      {evt.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveIncidentRadar;
