import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Zap, 
  Wifi, 
  Activity, 
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

const CAMPUS_ZONES = [
  {
    id: 'hostels',
    name: 'Hostel Complex (Blocks A, B, C & Mess)',
    shortCode: 'ZONE-H',
    type: 'Residential & Dining',
    healthScore: 98.6,
    status: 'Operational',
    leadTech: 'Mario Rossi (Plumbing) & Alex Vance (Electrical)',
    activeWorkOrders: 2,
    recentLog: 'Restroom water filter valve replaced in Block B Rm 204',
    coordinates: { x: 22, y: 35 },
    icon: Building,
    color: '#0284c7',
    bg: '#f0f9ff',
    infrastructure: ['380 Student Rooms', '4 Dining Halls', 'Solar Water Heaters', 'RO Filtration Plant']
  },
  {
    id: 'academic',
    name: 'Main Academic & Lecture Theatres',
    shortCode: 'ZONE-A',
    type: 'Classrooms & Theatres',
    healthScore: 100.0,
    status: 'Operational',
    leadTech: 'Bob Stone (Civil) & Alex Vance (Electrical)',
    activeWorkOrders: 0,
    recentLog: 'Auditorium 1 acoustic panel and stage lighting certified',
    coordinates: { x: 50, y: 25 },
    icon: Building,
    color: '#7c3aed',
    bg: '#f5f3ff',
    infrastructure: ['42 Smart Classrooms', '3 Lecture Theatres', 'Central HVAC', 'Emergency Exits']
  },
  {
    id: 'tech_labs',
    name: 'Tech Innovation & Computer Labs',
    shortCode: 'ZONE-T',
    type: 'Research & Computing',
    healthScore: 99.8,
    status: 'Operational',
    leadTech: 'Sam Lin (Lead Network Tech)',
    activeWorkOrders: 1,
    recentLog: 'Lab 4 fiber backbone switch firmware updated',
    coordinates: { x: 75, y: 40 },
    icon: Wifi,
    color: '#2563eb',
    bg: '#eff6ff',
    infrastructure: ['12 Computer Laboratories', '10G Fiber Backbone', 'Server Room Dual UPS', 'Smart Boards']
  },
  {
    id: 'library',
    name: 'Central Library & Learning Commons',
    shortCode: 'ZONE-L',
    type: 'Library & Digital Archives',
    healthScore: 99.2,
    status: 'Operational',
    leadTech: 'Facilities Team',
    activeWorkOrders: 0,
    recentLog: 'Floor 2 LED reading fixture array replaced',
    coordinates: { x: 38, y: 65 },
    icon: Building,
    color: '#059669',
    bg: '#ecfdf5',
    infrastructure: ['4 Floors Reading Commons', 'RFID Book Drop Hub', 'Silent Study Carrels', 'Climate Control']
  },
  {
    id: 'sports',
    name: 'Sports Stadium & Indoor Gymnasium',
    shortCode: 'ZONE-S',
    type: 'Athletics & Recreation',
    healthScore: 100.0,
    status: 'Operational',
    leadTech: 'Civil & Sanitation',
    activeWorkOrders: 0,
    recentLog: 'Basketball court wooden polish and floodlight inspection',
    coordinates: { x: 78, y: 72 },
    icon: Activity,
    color: '#ea580c',
    bg: '#fff7ed',
    infrastructure: ['Olympic Track', 'Indoor Hardwood Court', 'Olympic Pool Pumps', 'Locker Restrooms']
  },
  {
    id: 'admin_health',
    name: 'Administration & Health Center',
    shortCode: 'ZONE-M',
    type: 'Governance & First Aid',
    healthScore: 100.0,
    status: 'Operational',
    leadTech: 'Campus Administrator Desk',
    activeWorkOrders: 0,
    recentLog: 'Emergency generator auto-transfer switch tested ok',
    coordinates: { x: 48, y: 80 },
    icon: ShieldCheck,
    color: '#475569',
    bg: '#f8fafc',
    infrastructure: ['Registrar Offices', 'Estate Management Depot', '24/7 First Aid Center', 'Server Control Room']
  }
];

const CampusInteractiveMap = () => {
  const [selectedZone, setSelectedZone] = useState(CAMPUS_ZONES[0]);

  return (
    <div className="campus-map-interactive-container">
      <div className="map-layout-grid">
        {/* Left Interactive Blueprint Canvas */}
        <div className="map-visual-panel">
          <div className="map-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="radar-sweep-dot" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Campus Telemetry Blueprint
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              Grid: 6 Managed Sectors
            </span>
          </div>

          <div className="campus-blueprint-map">
            {/* Background Grid Lines */}
            <div className="blueprint-grid-overlay" />

            {/* Interactive Campus Zone Nodes */}
            {CAMPUS_ZONES.map((zone) => {
              const isSelected = selectedZone.id === zone.id;
              const ZoneIcon = zone.icon;

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`blueprint-node-btn ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${zone.coordinates.x}%`,
                    top: `${zone.coordinates.y}%`,
                    borderColor: isSelected ? zone.color : 'rgba(255,255,255,0.3)',
                    backgroundColor: isSelected ? zone.color : 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff'
                  }}
                  title={zone.name}
                >
                  <div className="node-icon-wrapper">
                    <ZoneIcon size={16} />
                  </div>
                  <span className="node-label-pill">{zone.shortCode}</span>
                  {zone.activeWorkOrders > 0 && (
                    <span className="node-alert-ping" />
                  )}
                </button>
              );
            })}

            {/* Simulated Campus Roads & Pathways */}
            <svg className="campus-svg-routes" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 22 35 L 50 25 L 75 40 L 78 72 L 48 80 L 38 65 Z" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M 50 25 L 38 65" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
              <path d="M 50 25 L 48 80" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
            </svg>
          </div>

          <div className="map-legend-bar">
            <div className="legend-item">
              <span className="legend-dot active" />
              <span>Normal Operations (100%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot warning" />
              <span>Active Work Order in Progress</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot pulse" />
              <span>Live Node Telemetry</span>
            </div>
          </div>
        </div>

        {/* Right Zone Details Card */}
        <div className="map-details-panel">
          <div className="zone-header-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className="zone-code-tag" style={{ backgroundColor: selectedZone.bg, color: selectedZone.color, borderColor: `${selectedZone.color}40` }}>
                {selectedZone.shortCode} &bull; {selectedZone.type}
              </span>
              <div className="zone-health-badge">
                <span className="health-dot operational" />
                <span>{selectedZone.healthScore}% Health</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: '0 0 0.25rem' }}>
              {selectedZone.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-slate-500)', margin: 0 }}>
              Primary On-Duty Technician: <strong>{selectedZone.leadTech}</strong>
            </p>
          </div>

          {/* Infrastructure Metrics */}
          <div className="zone-metrics-grid">
            <div className="zone-metric-card">
              <span className="zm-label">Active Work Orders</span>
              <span className="zm-val" style={{ color: selectedZone.activeWorkOrders > 0 ? '#d97706' : '#059669' }}>
                {selectedZone.activeWorkOrders} Active
              </span>
            </div>

            <div className="zone-metric-card">
              <span className="zm-label">SLA Compliance</span>
              <span className="zm-val" style={{ color: '#2563eb' }}>
                99.6%
              </span>
            </div>
          </div>

          {/* Infrastructure List */}
          <div style={{ margin: '1rem 0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
              Key Zone Facilities & Assets:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {selectedZone.infrastructure.map((item, idx) => (
                <span key={idx} className="infra-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Maintenance Log */}
          <div className="zone-recent-log">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#047857', marginBottom: '0.2rem' }}>
              <CheckCircle2 size={13} />
              <span>Latest Verified Maintenance:</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#065f46', margin: 0 }}>
              {selectedZone.recentLog}
            </p>
          </div>

          {/* Action CTA */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem' }}>
            <Link
              to={`/complaints/new?location=${encodeURIComponent(selectedZone.name)}`}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.65rem', fontWeight: 600, gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <PlusCircle size={15} />
              <span>Report Issue for this Zone</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusInteractiveMap;
