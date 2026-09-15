import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardRoute } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spin" style={{ width: '36px', height: '36px', border: '3px solid var(--color-slate-200)', borderTopColor: 'var(--color-brand-600)', borderRadius: '50%' }} />
        <div style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem', fontWeight: 500 }}>
          Verifying security session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      // Redirect unauthorized role to their own designated dashboard
      const fallbackRoute = getDashboardRoute(userRole);
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
