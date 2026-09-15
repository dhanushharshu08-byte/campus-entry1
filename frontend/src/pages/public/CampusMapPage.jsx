import React from 'react';
import CampusInteractiveMap from '../../components/unique/CampusInteractiveMap';
import LiveIncidentRadar from '../../components/unique/LiveIncidentRadar';
import { MapPin, Shield, Sparkles, Building2 } from 'lucide-react';

const CampusMapPage = () => {
  return (
    <div className="campus-map-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <MapPin size={14} />
            <span>Interactive Campus Telemetry</span>
          </div>
          <h1 className="page-header-title">Campus Facilities & Zone Radar Map</h1>
          <p className="page-header-subtitle">
            Explore college infrastructure across residential hostels, academic lecture complexes, computer science labs, and sports facilities with real-time operational health ratings.
          </p>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Interactive Map Component */}
        <CampusInteractiveMap />

        {/* Live Incident Radar */}
        <div style={{ marginTop: '2.5rem' }}>
          <LiveIncidentRadar />
        </div>
      </div>
    </div>
  );
};

export default CampusMapPage;
