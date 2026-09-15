import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CollegeBrandLogo from './brand/CollegeBrandLogo';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { 
  Home, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Bell, 
  User, 
  Wrench, 
  Building2, 
  Users, 
  BarChart3, 
  Sliders, 
  LogOut,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '1.25rem 1rem' }}>
        <CollegeBrandLogo variant="compact" size={32} />
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        {isAuthenticated && user ? (
          <>
            {/* Student & Faculty Navigation */}
            {(user.role === 'student' || user.role === 'faculty') && (
              <>
                <NavLink
                  to={user.role === 'student' ? "/student/dashboard" : "/faculty/dashboard"}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/complaints/new"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <PlusCircle size={18} />
                  <span>Report Issue</span>
                </NavLink>

                <NavLink
                  to="/complaints"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <FileText size={18} />
                  <span>My Complaints</span>
                </NavLink>

                <NavLink
                  to="/notifications"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <User size={18} />
                  <span>Profile</span>
                </NavLink>
              </>
            )}

            {/* Maintenance Navigation */}
            {user.role === 'maintenance' && (
              <>
                <NavLink
                  to="/maintenance/dashboard"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Operations Dashboard</span>
                </NavLink>

                <NavLink
                  to="/notifications"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <User size={18} />
                  <span>Profile</span>
                </NavLink>
              </>
            )}

            {/* Management Navigation */}
            {user.role === 'management' && (
              <>
                <NavLink
                  to="/management/dashboard"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Overview</span>
                </NavLink>

                <NavLink
                  to="/management/complaints"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <FileText size={18} />
                  <span>Complaints</span>
                </NavLink>

                <NavLink
                  to="/management/departments"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Building2 size={18} />
                  <span>Departments</span>
                </NavLink>

                <NavLink
                  to="/management/users"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Users size={18} />
                  <span>Users</span>
                </NavLink>

                <NavLink
                  to="/management/reports"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <BarChart3 size={18} />
                  <span>Reports</span>
                </NavLink>

                <NavLink
                  to="/notifications"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                </NavLink>

                <NavLink
                  to="/management/settings"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Sliders size={18} />
                  <span>Settings</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <User size={18} />
                  <span>Profile</span>
                </NavLink>
              </>
            )}
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Sign In</span>
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              <span>Register</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* College Info & Authenticated user footer */}
      {isAuthenticated && user ? (
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--color-slate-200)', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-slate-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-brand-600)', textTransform: 'capitalize', fontWeight: 600 }}>
                {user.role === 'management' ? 'Campus Admin' : user.role === 'maintenance' ? 'Maintenance Staff' : user.role}
              </div>
            </div>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)', padding: '6px', borderRadius: '6px' }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--color-slate-200)', padding: '1rem', fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>{COLLEGE_CONFIG.COLLEGE_SHORT_NAME} Helpdesk</div>
          <div>{COLLEGE_CONFIG.CAMPUS_NAME}</div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
