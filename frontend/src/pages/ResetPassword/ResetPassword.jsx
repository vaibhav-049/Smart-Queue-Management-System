import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ResetPassword() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is missing. Please restart the process.');
      return;
    }
    if (otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Password reset successfully!');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : ''}`}>
      <div className="auth-container">
        <m.div
          className="auth-right"
          style={{ margin: '0 auto', flex: 1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-form-wrapper">
            <h2 className="auth-title">Set New Password</h2>
            <p className="auth-subtitle">Enter the OTP sent to <strong>{email}</strong></p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">Enter 6-Digit OTP</label>
                <div className="input-wrapper">
                  <FiLock size={18} className="input-icon" />
                  <input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrapper">
                  <FiLock size={18} className="input-icon" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <m.button
                type="submit"
                className="btn-primary-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </m.button>
            </form>

            <p className="auth-footer-text">
              <Link to="/login" className="auth-link">Back to Sign In</Link>
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
