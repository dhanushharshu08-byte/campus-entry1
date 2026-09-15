import React, { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';
import GlobalSearch from './GlobalSearch';
import CollegeBrandLogo from './brand/CollegeBrandLogo';
import { COLLEGE_CONFIG } from '../config/collegeConfig';
import { 
  LogOut, 
  LogIn, 
  UserPlus, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Search, 
  User, 
  Building2, 
  Users, 
  BarChart3, 
  Sliders,
  CheckCircle2,
  Clock,
  Wrench
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {/* Official Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <CollegeBrandLogo variant="compact" size={34} />
          </Link>

          {/* College Badge */}
          <div className="college-header-pill" style={{ display: 'none' }}>
            <span>{COLLEGE_CONFIG.COLLEGE_NAME}</span>
          </div>

          {/* Global search shortcut for management */}
          {user?.role === 'management' && (
            <button
              onClick={() => setSearchOpen(true)}
              className="header-search-btn"
              style={{ marginLeft: '1.25rem' }}
              title="Search records"
            >
              <Search size={14} color="var(--color-slate-400)" />
              <span className="search-text">Search complaints, users, staff...</span>
            </button>
          )}
        </div>

        <div className="header-right">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Student Navigation */}
              {user.role === 'student' && (
                <>
                  <NavLink to="/student/dashboard" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/complaints/new" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}>
                    <PlusCircle size={14} />
                    <span>Report Issue</span>
                  </NavLink>
                  <NavLink to="/complaints" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <FileText size={14} />
                    <span>My Complaints</span>
                  </NavLink>
                </>
              )}

              {/* Faculty Navigation */}
              {user.role === 'faculty' && (
                <>
                  <NavLink to="/faculty/dashboard" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/complaints/new" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}>
                    <PlusCircle size={14} />
                    <span>Report Issue</span>
                  </NavLink>
                  <NavLink to="/complaints" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <FileText size={14} />
                    <span>My Complaints</span>
                  </NavLink>
                </>
              )}

              {/* Maintenance Staff Navigation */}
              {user.role === 'maintenance' && (
                <>
                  <NavLink to="/maintenance/dashboard" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <LayoutDashboard size={14} />
                    <span>Operations Dashboard</span>
                  </NavLink>
                </>
              )}

              {/* Management Navigation */}
              {user.role === 'management' && (
                <>
                  <NavLink to="/management/dashboard" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <LayoutDashboard size={14} />
                    <span>Overview</span>
                  </NavLink>
                  <NavLink to="/management/complaints" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <FileText size={14} />
                    <span>Complaints</span>
                  </NavLink>
                  <NavLink to="/management/departments" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <Building2 size={14} />
                    <span>Departments</span>
                  </NavLink>
                  <NavLink to="/management/users" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <Users size={14} />
                    <span>Users</span>
                  </NavLink>
                  <NavLink to="/management/reports" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                    <BarChart3 size={14} />
                    <span>Reports</span>
                  </NavLink>
                </>
              )}

              {/* Real-time Notification Bell */}
              <NotificationBell />

              {/* Profile */}
              <NavLink to="/profile" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }} title="My Profile">
                <User size={14} />
                <span>Profile</span>
              </NavLink>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <NavLink to="/" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                Home
              </NavLink>
              <NavLink to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                <LogIn size={14} />
                <span>Sign In</span>
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
                <UserPlus size={14} />
                <span>Register</span>
              </NavLink>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal for Management */}
      {user?.role === 'management' && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
