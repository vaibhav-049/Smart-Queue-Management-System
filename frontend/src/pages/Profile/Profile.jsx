import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiUser, FiMail, FiPhone, FiBell, FiMoon, FiSave, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Profile() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [tokenStats, setTokenStats] = useState({ total: 0, completed: 0 });
  const [notifications, setNotifications] = useState(true);
  const [editing, setEditing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Password change states
  const [pwdStep, setPwdStep] = useState(1);
  const [pwdOtp, setPwdOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleSendPwdOtp = async () => {
    if (!user?.email) return;
    setPwdLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: user.email });
      if (response.data && response.data.success) {
        toast.success('OTP sent to your email successfully!');
        setPwdStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdOtp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    if (newPwd.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }

    setPwdLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: user.email,
        otp: pwdOtp,
        newPassword: newPwd
      });
      if (response.data && response.data.success) {
        toast.success('Password changed successfully!');
        setPwdStep(1);
        setPwdOtp('');
        setNewPwd('');
        setConfirmPwd('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Please check the OTP.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Set form values when user changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch profile stats
  useEffect(() => {
    if (user) {
      api.get('/users/profile-stats')
        .then(res => {
          if (res.data && res.data.success) {
            setTokenStats(res.data.data || { total: 0, completed: 0 });
          }
        })
        .catch(err => console.error('Error fetching profile token stats:', err));
    }
  }, [user]);

  const handleSave = async () => {
    setEditing(false);
    await updateProfile({
      name: form.name,
      phone: form.phone,
    });
  };

  const handleUpgradeVIP = async () => {
    setPaymentLoading(true);
    try {
      // Check if Razorpay SDK is loaded
      if (typeof window.Razorpay === 'undefined') {
        toast.error('Payment gateway is loading. Please wait a moment and try again.');
        // Try to dynamically load the script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.head.appendChild(script);
        setPaymentLoading(false);
        return;
      }

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay configuration is missing in the frontend environment variables');
      }

      const orderRes = await api.post('/payments/create-order');
      if (!orderRes.data.success) throw new Error(orderRes.data.message || 'Order creation failed');
      const order = orderRes.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SmartQueue',
        description: 'VIP Membership (30 Days)',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              toast.success('Successfully upgraded to VIP!');
              setTimeout(() => window.location.reload(), 1500);
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#8B5CF6',
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not initiate payment';
      if (msg.includes('not configured') || msg.includes('RAZORPAY')) {
        toast.error('Payment gateway is not configured. Please contact the administrator.');
      } else {
        toast.error(msg);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className={`profile-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </m.div>

      <div className="profile-layout">
        {}
        <m.div
          className="profile-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-lg">
                {form.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button type="button" className="avatar-upload-btn">
                <FiCamera size={16} />
              </button>
            </div>
            <h2 className="profile-name">{form.name}</h2>
            <p className="profile-role">
              {user?.role === 'admin'
                ? (!user.service 
                  ? 'Super Admin' 
                  : `${user.service === 'college' ? 'College Office' : user.service.charAt(0).toUpperCase() + user.service.slice(1)} Admin`)
                : 'User'}
            </p>
            <span className="profile-badge" style={{ textTransform: 'capitalize' }}>
              {user?.role === 'admin'
                ? (!user.service ? 'Platform Admin' : 'Service Provider')
                : (user?.isVip ? '🌟 VIP Member' : 'Customer Account')}
            </span>
            {user?.isVip && user?.vipValidTill && (
              <p style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '4px', fontWeight: '500' }}>
                Valid till: {new Date(user.vipValidTill).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-value">{tokenStats.total || 0}</span>
              <span className="profile-stat-label">{user?.role === 'admin' ? 'Served' : 'Tokens'}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{tokenStats.completed || 0}</span>
              <span className="profile-stat-label">Completed</span>
            </div>
            {user?.role === 'admin' ? (
              <div className="profile-stat">
                <span className="profile-stat-value">{tokenStats.rating ? tokenStats.rating : 'N/A'}</span>
                <span className="profile-stat-label">Rating</span>
              </div>
            ) : (
              <div className="profile-stat">
                <span className="profile-stat-value">{tokenStats.cancelled !== undefined ? tokenStats.cancelled : 0}</span>
                <span className="profile-stat-label">Cancelled</span>
              </div>
            )}
          </div>
        </m.div>

        {}
        <div className="profile-details-section">
          {}
          {user?.role === 'user' && !user?.isVip && (
            <m.div
              className="profile-details-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: '1px solid #FDE68A',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌟</span> Upgrade to VIP
                  </h3>
                  <p style={{ color: '#92400E', fontSize: '0.9rem', marginTop: '4px' }}>
                    Skip the queue! Get priority tokens automatically for 30 days.
                  </p>
                </div>
                <m.button
                  type="button"
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgradeVIP}
                  disabled={paymentLoading}
                  style={{ background: '#D97706', border: 'none' }}
                >
                  {paymentLoading ? (
                    <span className="btn-content-loading"><span className="btn-spinner"></span> Processing...</span>
                  ) : 'Pay ₹99'}
                </m.button>
              </div>
            </m.div>
          )}

          {}
          <m.div
            className="profile-details-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header-row">
              <h3>Personal Information</h3>
              <m.button
                type="button"
                className={`btn-outline-sm ${editing ? 'btn-primary-sm' : ''}`}
                onClick={() => editing ? handleSave() : setEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {editing ? <><FiSave size={16} /> Save</> : 'Edit'}
              </m.button>
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="pf-name"><FiUser size={16} /> Full Name</label>
                <input
                  id="pf-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pf-email"><FiMail size={16} /> Email Address</label>
                <input
                  id="pf-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pf-phone"><FiPhone size={16} /> Phone Number</label>
                <input
                  id="pf-phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>
          </m.div>

          {}
          <m.div
            className="profile-settings-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3>Settings</h3>

            <div className="setting-item">
              <div className="setting-info">
                <FiBell size={18} />
                <div>
                  <p className="setting-title">Push Notifications</p>
                  <p className="setting-desc">Receive token alerts and queue updates</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => {
                    setNotifications(!notifications);
                    toast.success(notifications ? 'Notifications disabled' : 'Notifications enabled');
                  }}
                  aria-label="Push Notifications"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <FiMoon size={18} />
                <div>
                  <p className="setting-title">Dark Mode</p>
                  <p className="setting-desc">Switch between light and dark theme</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  aria-label="Dark Mode"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </m.div>

          {}
          <m.div
            className="profile-settings-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: '1.5rem' }}
          >
            <h3>Change Password</h3>
            <p className="setting-desc" style={{ marginBottom: '1.25rem' }}>
              Verify your identity via email OTP to set a new password.
            </p>

            {pwdStep === 1 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSendPwdOtp}
                disabled={pwdLoading}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                {pwdLoading ? (
                  <span className="btn-content-loading"><span className="btn-spinner"></span> Sending OTP...</span>
                ) : 'Send OTP to Email'}
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="profile-form">
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  marginBottom: '1.25rem',
                  background: 'var(--primary-bg)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: '1.4'
                }}>
                  Verification code has been sent to <strong>{user?.email}</strong>.
                </div>
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="pwd-otp">6-Digit OTP Code</label>
                  <input
                    id="pwd-otp"
                    type="text"
                    placeholder="Enter OTP"
                    maxLength={6}
                    value={pwdOtp}
                    onChange={e => setPwdOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ textAlign: 'center', letterSpacing: pwdOtp ? '4px' : 'normal' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="new-pwd">New Password</label>
                  <input
                    id="new-pwd"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="confirm-pwd">Confirm New Password</label>
                  <input
                    id="confirm-pwd"
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={pwdLoading}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    {pwdLoading ? (
                      <span className="btn-content-loading"><span className="btn-spinner"></span> Updating...</span>
                    ) : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => { setPwdStep(1); setPwdOtp(''); setNewPwd(''); setConfirmPwd(''); }}
                    style={{ flex: 0.5, padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </m.div>
        </div>
      </div>
    </div>
  );
}
