import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ForgotPassword() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'OTP sent successfully!');
        navigate('/reset-password', { state: { email } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
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
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your email to receive a reset OTP.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail size={18} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <m.button
                type="submit"
                className="btn-primary-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </m.button>
            </form>

            <p className="auth-footer-text">
              Remember your password? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
