import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  Zap, 
  Wrench, 
  Building2, 
  Wifi, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  PhoneCall, 
  ArrowRight,
  PlusCircle,
  Search,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const FACILITIES_DATA = [
  {
    id: 1,
    name: 'Electrical & Power Systems',
    code: 'ELEC',
    icon: Zap,
    color: '#eab308',
    bg: '#fefce8',
    office: 'Workshop Block, Ground Floor',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 101)`,
    hours: '24/7 On-Call Support',
    standardSla: '4 Hours (High) / 24 Hours (Medium)',
    scope: [
      'Classroom & lecture hall lighting & fan fixtures',
      'Backup diesel generator & lab UPS power maintenance',
      'Substation and main distribution switchboards',
      'Laboratory voltage stabilizers and power sockets',
      'Hostel corridor & room electrical circuits'
    ]
  },
  {
    id: 2,
    name: 'Plumbing & Water Systems',
    code: 'PLUMB',
    icon: Wrench,
    color: '#0284c7',
    bg: '#f0f9ff',
    office: 'Estate Unit, Mechanical Block',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 102)`,
    hours: '06:00 AM - 10:00 PM (Emergency 24/7)',
    standardSla: '4 Hours (High) / 24 Hours (Medium)',
    scope: [
      'Restroom fixtures, flush valves, and tap leaks',
      'Drinking water purification and cooler maintenance',
      'Underground drainage and pipeline blockage clearing',
      'Overhead water reservoir pumping & level sensors',
      'Hostel solar water heaters and plumbing lines'
    ]
  },
  {
    id: 3,
    name: 'Civil & Structural Maintenance',
    code: 'CIVIL',
    icon: Building2,
    color: '#ea580c',
    bg: '#fff7ed',
    office: 'Admin Block, Civil Maintenance Desk',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 103)`,
    hours: '08:00 AM - 06:00 PM',
    standardSla: '24 Hours (Medium) / 72 Hours (Low)',
    scope: [
      'Wall plastering, masonry, and cosmetic painting',
      'Roof waterproofing and rainwater drainage gutters',
      'Door fixtures, window glass & aluminum frames',
      'Campus walkways, ramps, and pavement leveling',
      'Hostel room tiling, flooring, and masonry repairs'
    ]
  },
  {
    id: 4,
    name: 'IT, Smart Classroom & Network',
    code: 'ITNET',
    icon: Wifi,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    office: 'Computer Science Block, Level 2',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 104)`,
    hours: '08:00 AM - 08:00 PM',
    standardSla: '4 Hours (High) / 24 Hours (Medium)',
    scope: [
      'Campus Wi-Fi access points & signal coverage',
      'Computer laboratory LAN switches and patch panels',
      'Smart classroom projectors, interactive displays & audio',
      'Auditorium sound system and media consoles',
      'Department faculty desktop LAN network drops'
    ]
  },
  {
    id: 5,
    name: 'Housekeeping & Campus Sanitation',
    code: 'CLEAN',
    icon: Sparkles,
    color: '#10b981',
    bg: '#ecfdf5',
    office: 'Sanitation Office, Canteen Complex',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 105)`,
    hours: '06:00 AM - 07:00 PM',
    standardSla: '4 Hours (High) / 12 Hours (Medium)',
    scope: [
      'Classroom and seminar hall floor sanitization',
      'Washroom deep cleaning and hygiene supply refills',
      'Corridor, stairwell, and quadrangle waste clearance',
      'Hostel common areas and dining hall hygiene',
      'Campus segregation and waste recycling management'
    ]
  },
  {
    id: 6,
    name: 'Furniture & Carpentry Workshop',
    code: 'CARP',
    icon: Layers,
    color: '#b45309',
    bg: '#fffbeb',
    office: 'Carpentry Workshop, Mechanical Block',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 106)`,
    hours: '08:30 AM - 05:30 PM',
    standardSla: '24 Hours (Medium) / 72 Hours (Low)',
    scope: [
      'Lecture hall benches, dual desks, and podium repairs',
      'Faculty cabin tables, office chairs & book racks',
      'Auditorium cushioned seating alignment and upholstery',
      'Door locks, latches, cupboard hinges & blackboard frames',
      'Hostel study tables, cots, and wardrobe repairs'
    ]
  },
  {
    id: 7,
    name: 'General Campus Facilities',
    code: 'OTHER',
    icon: HelpCircle,
    color: '#64748b',
    bg: '#f1f5f9',
    office: 'Central Estate Unit, Admin Block',
    phone: `${COLLEGE_CONFIG.COLLEGE_PHONE} (Ext. 107)`,
    hours: '08:00 AM - 06:00 PM',
    standardSla: '24 Hours (Medium) / 72 Hours (Low)',
    scope: [
      'Sports grounds, indoor stadium & gym equipment',
      'Campus signage, notice boards, and wayfinding',
      'Perimeter boundary lighting and gate barriers',
      'Food court utilities and open lawn maintenance',
      'Miscellaneous infrastructure requests'
    ]
  }
];

const FacilitiesPage = () => {
  const { isAuthenticated } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  const filtered = FACILITIES_DATA.filter(f => 
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.scope.some(s => s.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="facilities-page-container">
      {/* Header Band */}
      <div className="page-header-band">
        <div className="page-header-inner">
          <div className="section-tag" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            {COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Maintenance Matrix
          </div>
          <h1 className="page-header-title">Campus Maintenance Divisions</h1>
          <p className="page-header-subtitle">
            {COLLEGE_CONFIG.COLLEGE_NAME} &bull; {COLLEGE_CONFIG.CAMPUS_NAME}
          </p>
        </div>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Search Filter Bar */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-slate-400)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search departments or repair types (e.g. fan, Wi-Fi, tap, bench)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <Link to={isAuthenticated ? "/complaints/new" : "/login"} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}>
              <PlusCircle size={16} />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>

        {/* Facilities Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((dept) => {
            const DeptIcon = dept.icon;
            return (
              <div key={dept.id} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: dept.bg, color: dept.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DeptIcon size={22} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: dept.bg, color: dept.color }}>
                      {dept.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
                    {dept.name}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="var(--color-slate-400)" />
                      <span>{dept.office}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={13} color="var(--color-slate-400)" />
                      <span>{dept.hours}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Scope of Maintenance:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--color-slate-600)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {dept.scope.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ borderTop: '1px solid var(--color-slate-100)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)' }}>
                    Standard SLA: {dept.standardSla.split('/')[0]}
                  </span>
                  <Link 
                    to={isAuthenticated ? "/complaints/new" : "/login"} 
                    style={{ fontSize: '0.825rem', fontWeight: 700, color: dept.color, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>Report Request</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacilitiesPage;
