import React from 'react';

/**
 * AbstractGeometricBackground
 * 
 * Clean, lightweight, professional vector background with subtle abstract geometry:
 * - Concentric circles & orbital rings
 * - Hexagons, polygons & delicate triangles
 * - Connected geometric nodes with dashed constellation lines
 * - Smooth geometric wave curves
 * - Micro-dot matrix grid
 * - Soft ambient gradients in cyan, royal blue, purple, and light violet
 * 
 * Kept at very low opacity behind all UI cards, forms, tables, and dashboards.
 */
const AbstractGeometricBackground = () => {
  return (
    <div className="abstract-geo-bg-root" aria-hidden="true">
      {/* 1. Ambient Glow Orbs */}
      <div className="geo-glow-orb geo-glow-cyan" />
      <div className="geo-glow-orb geo-glow-purple" />
      <div className="geo-glow-orb geo-glow-blue" />
      <div className="geo-glow-orb geo-glow-violet" />

      {/* 2. Micro Dot Grid Layer */}
      <div className="geo-dot-grid-overlay" />

      {/* 3. Responsive SVG Geometric Vector Canvas */}
      <svg
        className="geo-svg-canvas"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Linear Gradients */}
          <linearGradient id="geoGradBlueCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="geoGradPurpleViolet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="geoGradCyanBlue" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>

          {/* Hexagon Pattern Definition */}
          <pattern id="hexPattern" width="60" height="103.92" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path
              d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z M30 103.92 L60 86.6 L60 51.96 L30 69.28 L0 51.96 L0 86.6 Z"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.6"
              strokeOpacity="0.06"
            />
          </pattern>
        </defs>

        {/* --- SECTION A: Hexagonal Grid Accent Bands --- */}
        <rect x="0" y="40" width="360" height="280" fill="url(#hexPattern)" opacity="0.8" />
        <rect x="1100" y="550" width="340" height="320" fill="url(#hexPattern)" opacity="0.6" />

        {/* --- SECTION B: Top-Left Geometric Node Constellation --- */}
        <g className="geo-group geo-group-topleft">
          {/* Concentric Rings */}
          <circle cx="120" cy="140" r="110" fill="none" stroke="url(#geoGradBlueCyan)" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="120" cy="140" r="70" fill="none" stroke="#0284c7" strokeWidth="0.8" strokeOpacity="0.18" />
          <circle cx="120" cy="140" r="30" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.22" />

          {/* Connected Node Lines */}
          <line x1="120" y1="140" x2="260" y2="90" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 4" />
          <line x1="260" y1="90" x2="380" y2="160" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.18" />
          <line x1="120" y1="140" x2="190" y2="280" stroke="#7c3aed" strokeWidth="0.9" strokeOpacity="0.18" />
          <line x1="190" y1="280" x2="320" y2="260" stroke="#06b6d4" strokeWidth="0.9" strokeOpacity="0.16" strokeDasharray="3 3" />
          <line x1="380" y1="160" x2="320" y2="260" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.18" />

          {/* Node Points */}
          <circle cx="120" cy="140" r="4" fill="#0284c7" fillOpacity="0.45" />
          <circle cx="260" cy="90" r="3.5" fill="#2563eb" fillOpacity="0.5" />
          <circle cx="380" cy="160" r="4.5" fill="#7c3aed" fillOpacity="0.4" />
          <circle cx="190" cy="280" r="3" fill="#06b6d4" fillOpacity="0.45" />
          <circle cx="320" cy="260" r="4" fill="#3b82f6" fillOpacity="0.45" />

          {/* Subtle Small Triangles */}
          <polygon points="260,90 290,130 230,120" fill="none" stroke="#2563eb" strokeWidth="0.75" strokeOpacity="0.14" />
          <polygon points="190,280 230,320 170,330" fill="none" stroke="#7c3aed" strokeWidth="0.75" strokeOpacity="0.12" />
        </g>

        {/* --- SECTION C: Top-Right Technical Hexagons & Orbital Rings --- */}
        <g className="geo-group geo-group-topright">
          {/* Large Concentric Tech Rings */}
          <circle cx="1320" cy="120" r="160" fill="none" stroke="url(#geoGradPurpleViolet)" strokeWidth="1" />
          <circle cx="1320" cy="120" r="120" fill="none" stroke="#8b5cf6" strokeWidth="0.8" strokeOpacity="0.16" strokeDasharray="8 6" />
          <circle cx="1320" cy="120" r="60" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.2" />

          {/* Floating Hexagons */}
          <polygon points="1220,160 1250,142 1280,160 1280,195 1250,212 1220,195" fill="none" stroke="#7c3aed" strokeWidth="1.2" strokeOpacity="0.2" />
          <polygon points="1130,90 1155,75 1180,90 1180,120 1155,135 1130,120" fill="none" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.16" strokeDasharray="3 3" />
          <polygon points="1360,260 1380,248 1400,260 1400,284 1380,296 1360,284" fill="none" stroke="#0891b2" strokeWidth="0.9" strokeOpacity="0.18" />

          {/* Angled Technical Guideline */}
          <line x1="1080" y1="40" x2="1400" y2="360" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.1" strokeDasharray="8 8" />
          <circle cx="1240" cy="200" r="3" fill="#a855f7" fillOpacity="0.4" />
        </g>

        {/* --- SECTION D: Center Ambient Flow & Wave Curves --- */}
        <g className="geo-group geo-group-center">
          {/* Soft Isometric Wave Paths */}
          <path
            d="M -100 450 C 300 380, 600 560, 1000 440 C 1200 380, 1400 480, 1550 430"
            fill="none"
            stroke="url(#geoGradBlueCyan)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <path
            d="M -100 490 C 350 420, 650 600, 1050 480 C 1250 420, 1450 520, 1550 470"
            fill="none"
            stroke="url(#geoGradPurpleViolet)"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeDasharray="6 6"
          />

          {/* Central Connected Diamond Accent */}
          <polygon points="720,380 750,420 720,460 690,420" fill="none" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.15" />
          <circle cx="720" cy="420" r="3" fill="#0284c7" fillOpacity="0.35" />
        </g>

        {/* --- SECTION E: Bottom-Left Precision Geo Cluster --- */}
        <g className="geo-group geo-group-bottomleft">
          {/* Concentric Quarter Rings */}
          <circle cx="80" cy="820" r="180" fill="none" stroke="url(#geoGradCyanBlue)" strokeWidth="1.2" strokeDasharray="10 8" />
          <circle cx="80" cy="820" r="120" fill="none" stroke="#0284c7" strokeWidth="0.9" strokeOpacity="0.18" />
          <circle cx="80" cy="820" r="60" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.22" />

          {/* Connected Network Nodes */}
          <line x1="80" y1="820" x2="220" y2="760" stroke="#0891b2" strokeWidth="1" strokeOpacity="0.18" />
          <line x1="220" y1="760" x2="340" y2="830" stroke="#3b82f6" strokeWidth="0.9" strokeOpacity="0.16" strokeDasharray="5 5" />
          <line x1="220" y1="760" x2="260" y2="660" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.18" />

          <circle cx="220" cy="760" r="4" fill="#0891b2" fillOpacity="0.4" />
          <circle cx="340" cy="830" r="3.5" fill="#3b82f6" fillOpacity="0.4" />
          <circle cx="260" cy="660" r="4" fill="#7c3aed" fillOpacity="0.4" />

          {/* Triangle Matrix */}
          <polygon points="260,660 300,700 240,710" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.14" />
        </g>

        {/* --- SECTION F: Bottom-Right Tech Polygon Network --- */}
        <g className="geo-group geo-group-bottomright">
          {/* Hexagon & Poly Grid */}
          <polygon points="1280,740 1315,720 1350,740 1350,780 1315,800 1280,780" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeOpacity="0.18" />
          <polygon points="1180,800 1210,783 1240,800 1240,835 1210,852 1180,835" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.16" strokeDasharray="4 4" />

          {/* Node Connections */}
          <line x1="1315" y1="760" x2="1210" y2="817" stroke="#2563eb" strokeWidth="0.9" strokeOpacity="0.16" />
          <line x1="1315" y1="760" x2="1380" y2="670" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="6 4" />
          <line x1="1210" y1="817" x2="1100" y2="760" stroke="#8b5cf6" strokeWidth="0.9" strokeOpacity="0.15" />

          <circle cx="1315" cy="760" r="4.5" fill="#2563eb" fillOpacity="0.45" />
          <circle cx="1210" cy="817" r="4" fill="#7c3aed" fillOpacity="0.4" />
          <circle cx="1380" cy="670" r="3.5" fill="#06b6d4" fillOpacity="0.4" />
          <circle cx="1100" cy="760" r="3.5" fill="#8b5cf6" fillOpacity="0.35" />
        </g>
      </svg>
    </div>
  );
};

export default AbstractGeometricBackground;
