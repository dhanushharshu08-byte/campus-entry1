import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <AlertTriangle size={32} color="#dc2626" />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--color-slate-500)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
        The requested helpdesk view or module could not be found.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={16} />
        Return to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
