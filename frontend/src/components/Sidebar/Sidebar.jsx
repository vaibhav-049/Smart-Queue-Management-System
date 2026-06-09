import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  FiGrid, FiBookOpen, FiList, FiTag, FiBarChart2,
  FiUser, FiActivity, FiX
} from 'react-icons/fi';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: FiGrid },
  { path: '/book-token', label: 'Book Token', icon: FiBookOpen },
  { path: '/queue-status', label: 'Queue Status', icon: FiActivity },
  { path: '/my-tokens', label: 'My Tokens', icon: FiTag },
  { path: '/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/profile', label: 'Profile', icon: FiUser },
];

export default function Sidebar({ isOpen, onClose }) {
  const { darkMode } = useTheme();
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${isOpen ? 'open' : ''} ${darkMode ? 'dark' : ''}`}
        initial={false}
      >
        <div className="sidebar-header">
          <span className="sidebar-title">Navigation</span>
          <button className="sidebar-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              >
                <motion.div
                  className="sidebar-link-inner"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="sidebar-active-bg"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className="sidebar-icon" />
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar-sm">VP</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">Vikram Patel</p>
              <p className="sidebar-user-role">Administrator</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
