import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardRoute } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import WebsiteLayout from './layouts/WebsiteLayout';

// Public Website Views
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/public/FeaturesPage';
import FacilitiesPage from './pages/public/FacilitiesPage';
import TrackTicketPage from './pages/public/TrackTicketPage';
import SlaPolicyPage from './pages/public/SlaPolicyPage';
import ContactEmergencyPage from './pages/public/ContactEmergencyPage';
import DemoSandboxPage from './pages/public/DemoSandboxPage';
import CampusMapPage from './pages/public/CampusMapPage';

// Authentication & Core
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

// Role-Based Dashboard Views
import StudentDashboard from './pages/dashboards/StudentDashboard';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import MaintenanceDashboard from './pages/dashboards/MaintenanceDashboard';
import ManagementDashboard from './pages/dashboards/ManagementDashboard';

// Maintenance Views
import MaintenanceComplaintDetails from './pages/maintenance/MaintenanceComplaintDetails';

// Management Administration & Production Views
import ManagementComplaints from './pages/management/ManagementComplaints';
import ManagementComplaintDetails from './pages/management/ManagementComplaintDetails';
import ManagementInterventions from './pages/management/ManagementInterventions';
import ManagementUnassigned from './pages/management/ManagementUnassigned';
import ManagementOverdue from './pages/management/ManagementOverdue';
import ManagementStaff from './pages/management/ManagementStaff';
import ManagementUsers from './pages/management/ManagementUsers';
import ManagementDepartments from './pages/management/ManagementDepartments';
import ManagementReports from './pages/management/ManagementReports';
import ManagementAuditLogs from './pages/management/ManagementAuditLogs';
import ManagementSettings from './pages/management/ManagementSettings';
import ManagementActivity from './pages/management/ManagementActivity';

// Notification Center & Profile
import NotificationCenterPage from './pages/NotificationCenterPage';
import ProfilePage from './pages/ProfilePage';

// Grievance Module Views
import NewComplaintPage from './pages/complaints/NewComplaintPage';
import MyComplaintsPage from './pages/complaints/MyComplaintsPage';
import ComplaintDetailsPage from './pages/complaints/ComplaintDetailsPage';

// Dashboard router component that directs user to their role dashboard
const DynamicDashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute(user.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. PUBLIC INSTITUTIONAL WEBSITE (WebsiteLayout) */}
            <Route element={<WebsiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/campus-map" element={<CampusMapPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/facilities" element={<FacilitiesPage />} />
              <Route path="/track" element={<TrackTicketPage />} />
              <Route path="/sla-policy" element={<SlaPolicyPage />} />
              <Route path="/contact" element={<ContactEmergencyPage />} />
              <Route path="/demo" element={<DemoSandboxPage />} />
            </Route>

            {/* 2. AUTHENTICATED PORTAL & DASHBOARD APP (MainLayout) */}
            <Route element={<MainLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="dashboard" element={<DynamicDashboardRedirect />} />

              {/* Notification Center (All authenticated roles) */}
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={['student', 'faculty', 'maintenance', 'management']}>
                    <NotificationCenterPage />
                  </ProtectedRoute>
                }
              />

              {/* User Profile (All authenticated roles) */}
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'faculty', 'maintenance', 'management']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Grievance Submission Routes for Students and Faculty */}
              <Route
                path="complaints/new"
                element={
                  <ProtectedRoute allowedRoles={['student', 'faculty']}>
                    <NewComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="complaints"
                element={
                  <ProtectedRoute allowedRoles={['student', 'faculty']}>
                    <MyComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'faculty']}>
                    <ComplaintDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Role-Based Dashboard Routes */}
              <Route
                path="student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="faculty/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="maintenance/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['maintenance']}>
                    <MaintenanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="maintenance/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['maintenance']}>
                    <MaintenanceComplaintDetails />
                  </ProtectedRoute>
                }
              />

              {/* Protected Management Administration Routes */}
              <Route
                path="management/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/complaints"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementComplaintDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/interventions"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementInterventions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/unassigned"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementUnassigned />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/overdue"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementOverdue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/users"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/users/management"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementUsers defaultTab="management" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/staff"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementStaff />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/departments"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementDepartments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/reports"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementAuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/settings"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="management/activity"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementActivity />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
