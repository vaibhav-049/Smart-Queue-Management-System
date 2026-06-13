import { NavLink, useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiBookOpen, FiList, FiTag, FiBarChart2,
  FiUser, FiActivity, FiX, FiCamera
} from 'react-icons/fi';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: FiGrid },
  { path: '/admin/scanner', label: 'QR Scanner', icon: FiCamera },
  { path: '/book-token', label: 'Book Token', icon: FiBookOpen },
  { path: '/queue-status', label: 'Queue Status', icon: FiActivity },
  { path: '/my-tokens', label: 'My Tokens', icon: FiTag },
  { path: '/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/profile', label: 'Profile', icon: FiUser },
];

export default function Sidebar({ isOpen, onClose }) {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  const filteredItems = menuItems.filter((item) => {
    if (item.path === '/admin' || item.path === '/admin/scanner' || item.path === '/reports') {
      return user?.role === 'admin';
    }
    return true;
  });

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <m.aside
        className={`sidebar ${isOpen ? 'open' : ''} ${darkMode ? 'dark' : ''}`}
        initial={false}
      >
        <div className="sidebar-header">
          <span className="sidebar-title">Navigation</span>
          <button type="button" className="sidebar-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              >
                <m.div
                  className="sidebar-link-inner"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {isActive && (
                    <m.div
                      layoutId="sidebar-active"
                      className="sidebar-active-bg"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className="sidebar-icon" />
                  <span>{item.label}</span>
                </m.div>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.name || 'Guest User'}</p>
              <p className="sidebar-user-role">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </div>
      </m.aside>
    </>
  );
}
