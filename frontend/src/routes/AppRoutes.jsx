import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Pages
import DashboardPage from '../pages/DashboardPage';
import FamilyDashboardPage from '../pages/FamilyDashboardPage';
import JourneyStartPage from '../pages/JourneyStartPage';
import ActiveJourneyPage from '../pages/ActiveJourneyPage';
import FamilyTrackingPage from '../pages/FamilyTrackingPage';
import ContactsPage from '../pages/ContactsPage';
import AICompanionPage from '../pages/AICompanionPage';
import SOSIncidentPage from '../pages/SOSIncidentPage';
import JourneyHistoryPage from '../pages/JourneyHistoryPage';
import SafetyTipsPage from '../pages/SafetyTipsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // If OAuth token or code is present in URL, forward to /auth/callback to process Google session
  if (
    typeof window !== 'undefined' &&
    (window.location.hash.includes('access_token') ||
      window.location.search.includes('code=') ||
      window.location.hash.includes('error='))
  ) {
    return <Navigate to={`/auth/callback${window.location.search}${window.location.hash}`} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9FA]">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Home Route: Dispatches to Family Dashboard or Traveler Dashboard
const HomeRoute = () => {
  const { isFamily } = useAuth();
  if (isFamily) {
    return <Navigate to="/family" replace />;
  }
  return <DashboardPage />;
};

// Traveler Only Route Wrapper (Guards active journey/start from family members)
const TravelerRoute = ({ children }) => {
  const { isFamily } = useAuth();
  if (isFamily) {
    return <Navigate to="/family" replace />;
  }
  return children;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Public / Shared Family Live Tracking */}
      <Route element={<MainLayout />}>
        <Route path="/track/:trackingToken" element={<FamilyTrackingPage />} />
      </Route>

      {/* Protected Authenticated Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRoute />} />
        <Route path="/family" element={<FamilyDashboardPage />} />
        <Route
          path="/journey/start"
          element={
            <TravelerRoute>
              <JourneyStartPage />
            </TravelerRoute>
          }
        />
        <Route
          path="/journey/active"
          element={
            <TravelerRoute>
              <ActiveJourneyPage />
            </TravelerRoute>
          }
        />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/companion" element={<AICompanionPage />} />
        <Route path="/sos" element={<SOSIncidentPage />} />
        <Route path="/history" element={<JourneyHistoryPage />} />
        <Route path="/safety-tips" element={<SafetyTipsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Admin Section */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

