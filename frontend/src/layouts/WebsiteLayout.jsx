import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/public/PublicNavbar';
import PublicFooter from '../components/public/PublicFooter';
import NotificationToast from '../components/notifications/NotificationToast';
import AbstractGeometricBackground from '../components/background/AbstractGeometricBackground';

const WebsiteLayout = () => {
  return (
    <div className="public-website-container">
      <AbstractGeometricBackground />
      <PublicNavbar />
      <main className="public-website-main">
        <Outlet />
      </main>
      <PublicFooter />
      <NotificationToast />
    </div>
  );
};

export default WebsiteLayout;
