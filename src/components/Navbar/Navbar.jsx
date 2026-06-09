import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon, FiBell, FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { notifications as mockNotifications } from '../../services/mockData';

export default function Navbar({ onMenuToggle, isSidebarOpen }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const isDashboard = location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/book-token') ||
    location.pathname.startsWith('/queue-status') ||
    location.pathname.startsWith('/my-tokens') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/profile');

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/login', label: 'Login' },
    { path: '/register', label: 'Register' },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`navbar ${darkMode ? 'dark' : ''}`}
    >
      <div className="navbar-inner">
        {/* Left: Logo + Menu Toggle */}
        <div className="navbar-left">
          {isDashboard && (
            <button className="sidebar-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar">
              {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          )}
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Smart<span className="logo-highlight">Queue</span></span>
          </Link>
        </div>

        {/* Center: Public Navigation Links */}
        {!isDashboard && (
          <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
            {publicLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/book-token" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        )}

        {/* Right: Actions */}
        <div className="navbar-right">
          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="icon-btn"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <FiSun size={18} />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <FiMoon size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          {isDashboard && (
            <div className="notif-wrapper" ref={notifRef}>
              <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <FiBell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </motion.button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="dropdown-panel notif-panel"
                  >
                    <div className="dropdown-header">
                      <h4>Notifications</h4>
                      <span className="notif-count">{unreadCount} new</span>
                    </div>
                    <div className="dropdown-body">
                      {mockNotifications.map(n => (
                        <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                          <div className={`notif-dot ${n.type}`} />
                          <div className="notif-content">
                            <p className="notif-title">{n.title}</p>
                            <p className="notif-message">{n.message}</p>
                            <span className="notif-time">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile Dropdown */}
          {isDashboard && (
            <div className="profile-wrapper" ref={profileRef}>
              <button className="profile-trigger" onClick={() => setShowProfile(!showProfile)}>
                <div className="avatar-sm">VP</div>
                <span className="profile-name">Vikram</span>
                <FiChevronDown size={14} className={`chevron ${showProfile ? 'rotated' : ''}`} />
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="dropdown-panel profile-panel"
                  >
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                      <FiUser size={16} /> <span>My Profile</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                      <FiSettings size={16} /> <span>Settings</span>
                    </Link>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick={() => { setShowProfile(false); navigate('/login'); }}>
                      <FiLogOut size={16} /> <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Menu Toggle (Public) */}
          {!isDashboard && (
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
