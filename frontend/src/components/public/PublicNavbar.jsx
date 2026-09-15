import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../../context/AuthContext';
import CollegeBrandLogo from '../brand/CollegeBrandLogo';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';
import { 
  PlusCircle, 
  Search, 
  Menu, 
  X, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  UserPlus, 
  PhoneCall,
  Lock
} from 'lucide-react';

const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'Track Ticket', path: '/track' },
    { label: 'SLA Policy', path: '/sla-policy' },
    { label: 'Helpline', path: '/contact' },
  ];

  return (
    <>
      <header className="public-navbar-container">
        <div className="public-navbar-inner">
          {/* Official College Brand Logo */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <CollegeBrandLogo variant="compact" size={32} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="public-desktop-nav">
            {navLinks.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) => 
                  `public-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Action Controls */}
          <div className="public-nav-actions">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link
                  to={getDashboardRoute(user.role)}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost"
                  style={{ padding: '0.45rem', borderRadius: '8px', color: 'var(--color-slate-500)' }}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>

                <Link
                  to="/complaints/new"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 1rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  <PlusCircle size={15} />
                  <span>Report Issue</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="public-mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="public-mobile-nav">
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-slate-100)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-600)' }}>
              {COLLEGE_CONFIG.COLLEGE_NAME}
            </div>
            {navLinks.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-link"
              >
                {item.label}
              </Link>
            ))}

            <div className="mobile-nav-actions" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isAuthenticated && user ? (
                <Link
                  to={getDashboardRoute(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LayoutDashboard size={16} />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/complaints/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <PlusCircle size={16} />
                    <span>Report Issue</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default PublicNavbar;
