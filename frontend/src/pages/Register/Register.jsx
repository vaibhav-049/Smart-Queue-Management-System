import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { darkMode } = useTheme();
  const { register, verifyRegister, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/book-token');
      }
    }
  }, [user, navigate]);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [resendingOtp, setResendingOtp] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone) errs.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{10,}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length === 0) {
        const res = await register(form.name, form.email, form.phone, form.password);
        if (res.success) {
          setStep(2);
        }
      }
    } else {
      if (otp.length < 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }
      const res = await verifyRegister(form.email, otp);
      if (res.success) {
        navigate('/book-token');
      }
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const res = await register(form.name, form.email, form.phone, form.password);
      if (res.success) {
        setOtp('');
      }
    } finally {
      setResendingOtp(false);
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
            <h2>Join<br /><span className="gradient-text">SmartQueue</span></h2>
            <p>Create your account and start managing queues like a pro. Free for individuals.</p>
            <div className="auth-features-list">
              <div className="auth-feature">
                <span className="auth-feature-icon">✅</span>
                <span>Free 14-day trial</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">🔒</span>
                <span>Secure & encrypted</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">🚀</span>
                <span>Setup in 2 minutes</span>
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
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Fill in your details to get started</p>

            <form onSubmit={handleSubmit} className="auth-form">
              {step === 1 ? (
                <>
                  <div className={`form-group ${errors.name ? 'error' : ''}`}>
                    <label htmlFor="name">Full Name</label>
                    <div className="input-wrapper">
                      <FiUser size={18} className="input-icon" />
                      <input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className={`form-group ${errors.email ? 'error' : ''}`}>
                    <label htmlFor="reg-email">Email Address</label>
                    <div className="input-wrapper">
                      <FiMail size={18} className="input-icon" />
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper">
                      <FiPhone size={18} className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className={`form-group ${errors.password ? 'error' : ''}`}>
                    <label htmlFor="reg-password">Password</label>
                    <div className="input-wrapper">
                      <FiLock size={18} className="input-icon" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                      />
                      <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>

                  <m.button
                    type="submit"
                    className="btn-primary-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send Verification Code
                  </m.button>
                </>
              ) : (
                <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="form-group">
                    <label htmlFor="otp">Enter 6-Digit OTP</label>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      We sent a code to <strong>{form.email}</strong>.
                    </p>
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

                  <m.button
                    type="submit"
                    className="btn-primary-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ marginTop: '1rem' }}
                    disabled={loading || resendingOtp}
                  >
                    Verify & Create Account
                  </m.button>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={handleResendOtp}
                    disabled={loading || resendingOtp}
                    style={{ background: 'none', border: 'none', width: '100%', marginTop: '0.75rem', cursor: 'pointer', opacity: loading || resendingOtp ? 0.6 : 1 }}
                  >
                    {resendingOtp ? 'Resending OTP...' : 'Resend OTP'}
                  </button>
                  <button type="button" className="auth-link" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', width: '100%', marginTop: '1rem', cursor: 'pointer' }}>
                    Back to edit details
                  </button>
                </m.div>
              )}
            </form>

            <p className="auth-footer-text">
              Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
