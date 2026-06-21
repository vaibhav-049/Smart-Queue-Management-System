import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { FiSun, FiMoon, FiBell, FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import Tooltip from '../common/Tooltip';
import toast from 'react-hot-toast';

const publicLinks = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
];

export default function Navbar({ onMenuToggle, isSidebarOpen }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const isDashboard = location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/book-token') ||
    location.pathname.startsWith('/queue-status') ||
    location.pathname.startsWith('/my-tokens') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/profile');

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSocketNotification = (notif) => {
      setNotifications(prev => [
        {
          id: notif.id || Date.now(),
          title: notif.title || 'Queue Alert',
          message: notif.message || notif.text || '',
          time: 'Just now',
          read: false,
          type: notif.type || 'info',
        },
        ...prev,
      ]);
      toast(notif.message || notif.text, {
        icon: notif.type === 'success' ? '✅' : '🔔',
      });
    };

    socket.on('notification', handleSocketNotification);
    return () => {
      socket.off('notification', handleSocketNotification);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <m.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`navbar ${darkMode ? 'dark' : ''}`}
    >
      <div className="navbar-inner">
        {}
        <div className="navbar-left">
          {isDashboard && (
            <Tooltip text={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}>
              <button type="button" className="sidebar-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar">
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </Tooltip>
          )}
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/book-token') : '/'} className="navbar-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Smart<span className="logo-highlight">Queue</span></span>
          </Link>
        </div>

        {}
        {!isDashboard && (
          <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
            {user ? (
              <>
                <Link
                  to="/"
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/book-token'}
                  className={`nav-link ${location.pathname === (user.role === 'admin' ? '/admin' : '/book-token') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
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
                <Link to="/register" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}

        {}
        <div className="navbar-right">
          {}
          <Tooltip text={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <m.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className="icon-btn"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <m.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <FiSun size={18} />
                  </m.div>
                ) : (
                  <m.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <FiMoon size={18} />
                  </m.div>
                )}
              </AnimatePresence>
            </m.button>
          </Tooltip>

          {}
          {(isDashboard || user) && (
            <div className="notif-wrapper" ref={notifRef}>
            <Tooltip text="Notifications">
              <m.button
                type="button"
                whileTap={{ scale: 0.9 }}
                className="icon-btn"
                onClick={(e) => { e.stopPropagation(); setShowNotifications(n => !n); setShowProfile(false); }}
              >
                <FiBell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </m.button>
            </Tooltip>
              <AnimatePresence>
                {showNotifications && (
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="dropdown-panel notif-panel"
                  >
                    <div className="dropdown-header">
                      <h4>Notifications</h4>
                      <span className="notif-count">{unreadCount} new</span>
                    </div>
                    <div className="dropdown-body">
                      {notifications.length === 0 && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          No notifications yet
                        </div>
                      )}
                      {notifications.map(n => (
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
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {}
          {(isDashboard || user) && (
            <div className="profile-wrapper" ref={profileRef}>
              <Tooltip text="User Account">
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={(e) => { e.stopPropagation(); setShowProfile(p => !p); setShowNotifications(false); }}
                >
                  <div className="avatar-sm">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <span className="profile-name navbar-profile-name">
                    {user?.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  <FiChevronDown size={14} className={`chevron ${showProfile ? 'rotated' : ''}`} />
                </button>
              </Tooltip>
              <AnimatePresence>
                {showProfile && (
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="dropdown-panel profile-panel"
                  >
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                      <FiUser size={16} /> <span>My Profile</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                      <FiSettings size={16} /> <span>Settings</span>
                    </Link>
                    <hr className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item logout"
                      onClick={() => { setShowProfile(false); logout(); navigate('/login'); }}
                    >
                      <FiLogOut size={16} /> <span>Logout</span>
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {}
          {!isDashboard && (
            <Tooltip text={mobileMenuOpen ? "Close Menu" : "Open Menu"}>
              <button type="button" className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </m.nav>
  );
}
