import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const res = await login(form.email, form.password, rememberMe);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/book-token');
        }
      }
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : ''}`}>
      <div className="auth-container">
        {/* Left Panel */}
        <m.div
          className="auth-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-left-content">
            <span className="auth-logo">⚡</span>
            <h2>Welcome back to<br /><span className="gradient-text">SmartQueue</span></h2>
            <p>Manage your queues efficiently. Book tokens, track real-time status, and never wait in line again.</p>
            <div className="auth-features-list">
              <div className="auth-feature">
                <span className="auth-feature-icon">🎫</span>
                <span>Digital Token Booking</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">📡</span>
                <span>Live Queue Tracking</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">📊</span>
                <span>Analytics Dashboard</span>
              </div>
            </div>
          </div>
        </m.div>

        {/* Right Panel - Form */}
        <m.div
          className="auth-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="auth-form-wrapper">
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-subtitle">Enter your credentials to access your account</p>

            {/* Social Login */}
            <div className="social-login-buttons">
              <button type="button" className="social-btn" onClick={() => toast('Google login coming soon!')}>
                <FcGoogle size={20} /> <span>Google</span>
              </button>
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className={`form-group ${errors.email ? 'error' : ''}`}>
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail size={18} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.password ? 'error' : ''}`}>
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FiLock size={18} className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <m.button
                type="submit"
                className="btn-primary-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </m.button>
            </form>

            <p className="auth-footer-text">
              Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
