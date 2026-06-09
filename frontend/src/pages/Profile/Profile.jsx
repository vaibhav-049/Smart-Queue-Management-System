import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { currentUser } from '../../services/mockData';
import { FiUser, FiMail, FiPhone, FiBell, FiMoon, FiSave, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Profile() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
  });
  const [notifications, setNotifications] = useState(true);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className={`profile-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </motion.div>

      <div className="profile-layout">
        {/* Profile Card */}
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-lg">
                {form.name.split(' ').map(n => n[0]).join('')}
              </div>
              <button className="avatar-upload-btn">
                <FiCamera size={16} />
              </button>
            </div>
            <h2 className="profile-name">{form.name}</h2>
            <p className="profile-role">{currentUser.role === 'admin' ? 'Administrator' : 'User'}</p>
            <span className="profile-badge">Pro Plan</span>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-value">24</span>
              <span className="profile-stat-label">Tokens</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">18</span>
              <span className="profile-stat-label">Completed</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">4.8</span>
              <span className="profile-stat-label">Rating</span>
            </div>
          </div>
        </motion.div>

        {/* Details & Settings */}
        <div className="profile-details-section">
          {/* User Details */}
          <motion.div
            className="profile-details-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header-row">
              <h3>Personal Information</h3>
              <motion.button
                className={`btn-outline-sm ${editing ? 'btn-primary-sm' : ''}`}
                onClick={() => editing ? handleSave() : setEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {editing ? <><FiSave size={16} /> Save</> : 'Edit'}
              </motion.button>
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label><FiUser size={16} /> Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label><FiMail size={16} /> Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label><FiPhone size={16} /> Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div
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
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
