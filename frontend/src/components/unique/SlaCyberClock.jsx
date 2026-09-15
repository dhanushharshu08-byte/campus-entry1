import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Flame, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Pause,
  Zap,
  Sliders
} from 'lucide-react';

const SlaCyberClock = () => {
  const [priority, setPriority] = useState('High');
  const [elapsedPercent, setElapsedPercent] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);

  const priorityConfigs = {
    High: { totalHours: 4, name: 'High Priority' },
    Medium: { totalHours: 24, name: 'Medium Priority' },
    Low: { totalHours: 72, name: 'Low Priority' }
  };

  const config = priorityConfigs[priority];
  const totalMinutes = config.totalHours * 60;
  const elapsedMinutes = Math.round((elapsedPercent / 100) * totalMinutes);
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

  // Formatting hours & minutes
  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  // Determine Escalation Level based on elapsed percentage
  let level = 0;
  let levelName = 'Normal Target Window';
  let levelColor = '#059669';
  let levelBg = '#ecfdf5';
  let levelDesc = 'Grievance is progressing normally within the allocated standard SLA window.';

  if (elapsedPercent >= 200) {
    level = 3;
    levelName = 'Level 3: Critical Management Escalation';
    levelColor = '#7e22ce';
    levelBg = '#faf5ff';
    levelDesc = '200% of target exceeded. Direct high-priority alert dispatched to Executive Management Desk for mandatory intervention.';
  } else if (elapsedPercent >= 100) {
    level = 2;
    levelName = 'Level 2: SLA Breached & Overdue';
    levelColor = '#dc2626';
    levelBg = '#fef2f2';
    levelDesc = '100% of target exceeded. Ticket is flagged overdue, highlighted red, and recorded in compliance audit log.';
  } else if (elapsedPercent >= 75) {
    level = 1;
    levelName = 'Level 1: Approaching SLA Warning';
    levelColor = '#d97706';
    levelBg = '#fffbeb';
    levelDesc = '75% of target elapsed. Warning dispatched to technician alerting that only 25% of time remains.';
  }

  // Ticking effect when play is active
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedPercent((prev) => (prev >= 250 ? 0 : prev + 2));
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // SVG circular calculation (circumference for radius 70)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, elapsedPercent) / 100) * circumference;

  return (
    <div className="sla-cyber-clock-card">
      <div className="clock-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="clock-icon-box" style={{ color: levelColor, backgroundColor: levelBg }}>
            <Clock size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
              Live SLA Engine & Escalation Radar Clock
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
              Interactive visual simulator of CampuSentry&rsquo;s continuous SLA daemon
            </span>
          </div>
        </div>

        {/* Priority Switcher */}
        <div className="clock-priority-tabs">
          {['High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPriority(p);
                setElapsedPercent(45);
              }}
              className={`clock-p-btn ${priority === p ? 'active' : ''}`}
            >
              {p} ({priorityConfigs[p].totalHours}h)
            </button>
          ))}
        </div>
      </div>

      <div className="clock-body-grid">
        {/* Left: Circular Dial */}
        <div className="clock-dial-wrapper">
          <svg className="clock-svg-ring" width="180" height="180" viewBox="0 0 180 180">
            {/* Background Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            {/* Progress Arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={levelColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
              style={{ transition: 'all 0.25s ease' }}
            />
          </svg>

          {/* Center Digital Display */}
          <div className="clock-digital-center">
            <span className="clock-digital-time" style={{ color: levelColor }}>
              {elapsedPercent <= 100 ? formatTime(remainingMinutes) : `+${formatTime(elapsedMinutes - totalMinutes)}`}
            </span>
            <span className="clock-digital-sub">
              {elapsedPercent <= 100 ? 'Remaining' : 'Overdue'}
            </span>
          </div>
        </div>

        {/* Right: Telemetry & Controls */}
        <div className="clock-telemetry-panel">
          <div className="telemetry-status-box" style={{ borderColor: `${levelColor}40`, backgroundColor: levelBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: levelColor, textTransform: 'uppercase' }}>
                {levelName}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', color: levelColor }}>
                {elapsedPercent}% Elapsed
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-slate-700)', margin: 0, lineHeight: 1.45 }}>
              {levelDesc}
            </p>
          </div>

          {/* Interactive Progress Slider */}
          <div style={{ margin: '1rem 0 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.3rem' }}>
              <span>0h (Start)</span>
              <span>75% (Level 1)</span>
              <span>100% (Level 2)</span>
              <span>200% (Level 3)</span>
            </div>
            <input
              type="range"
              min="0"
              max="220"
              value={elapsedPercent}
              onChange={(e) => setElapsedPercent(Number(e.target.value))}
              className="sla-slider-input"
            />
          </div>

          {/* Play/Pause Simulator */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, gap: '0.35rem' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause Simulator' : 'Auto Simulate Lifecycle'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setElapsedPercent(0);
              }}
              className="btn btn-ghost"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', color: 'var(--color-slate-500)' }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlaCyberClock;
