import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

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
        </Route>

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/book-token" element={<BookToken />} />
          <Route path="/queue-status" element={<QueueStatus />} />
          <Route path="/my-tokens" element={<MyTokens />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
