import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import NotificationToast from '../components/notifications/NotificationToast';
import AbstractGeometricBackground from '../components/background/AbstractGeometricBackground';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showSidebar = Boolean(isAuthenticated && user && !isAuthPage);

  return (
    <div className={`app-container ${!showSidebar ? 'no-sidebar' : ''}`}>
      <AbstractGeometricBackground />
      {showSidebar && <Sidebar />}
      <main className="app-main">
        <Navbar />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
      <NotificationToast />
    </div>
  );
};

export default MainLayout;
