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

  // Fetch token stats
  useEffect(() => {
    if (user) {
      api.get('/tokens/my-tokens')
        .then(res => {
          if (res.data && res.data.success) {
            const list = res.data.data || [];
            const completedCount = list.filter(t => t.status === 'completed').length;
            setTokenStats({
              total: list.length,
              completed: completedCount
            });
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
        {/* Profile Card */}
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
            <p className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
            <span className="profile-badge">Pro Plan</span>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-value">{tokenStats.total}</span>
              <span className="profile-stat-label">Tokens</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{tokenStats.completed}</span>
              <span className="profile-stat-label">Completed</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">4.8</span>
              <span className="profile-stat-label">Rating</span>
            </div>
          </div>
        </m.div>

        {/* Details & Settings */}
        <div className="profile-details-section">
          {/* User Details */}
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

          {/* Settings */}
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
        </div>
      </div>
    </div>
  );
}
