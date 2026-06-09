import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiX, FiBell } from 'react-icons/fi';
import { notifications as mockNotifications } from '../../services/mockData';

const typeIcons = {
  alert: '⚠️',
  success: '✅',
  info: 'ℹ️',
  complete: '🎉',
};

export default function NotificationPanel({ isOpen, onClose }) {
  const { darkMode } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="notification-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`notification-panel ${darkMode ? 'dark' : ''}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="notification-panel-header">
              <div className="notification-panel-title">
                <FiBell size={20} />
                <h3>Notifications</h3>
              </div>
              <button onClick={onClose} className="notification-close">
                <FiX size={20} />
              </button>
            </div>

            <div className="notification-panel-body">
              {mockNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="notification-icon">{typeIcons[notif.type]}</span>
                  <div className="notification-content">
                    <p className="notification-title">{notif.title}</p>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                  {!notif.read && <div className="notification-unread-dot" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
