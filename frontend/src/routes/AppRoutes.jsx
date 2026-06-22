import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import BookToken from '../pages/BookToken/BookToken';
import QueueStatus from '../pages/QueueStatus/QueueStatus';
import MyTokens from '../pages/MyTokens/MyTokens';
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard';
import Reports from '../pages/Reports/Reports';
import Profile from '../pages/Profile/Profile';
import TrackToken from '../pages/TrackToken/TrackToken';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import QRScanner from '../pages/QRScanner/QRScanner';
import TVDisplay from '../pages/TVDisplay/TVDisplay';

import SuperAdminDashboard from '../pages/SuperAdminDashboard/SuperAdminDashboard';

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/book-token" replace />;
  }
  return <Outlet />;
}

// Helper component to render the correct dashboard
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin' && !user?.service) {
    return <SuperAdminDashboard />;
  }
  return <AdminDashboard />;
}

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/track/:tokenId" element={<TrackToken />} />
        </Route>

        {/* TV Display Route */}
        <Route path="/tv-display/:service" element={<TVDisplay />} />

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/book-token" element={<BookToken />} />
          <Route path="/queue-status" element={<QueueStatus />} />
          <Route path="/my-tokens" element={<MyTokens />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<DashboardRouter />} />
            <Route path="/admin/scanner" element={<QRScanner />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
