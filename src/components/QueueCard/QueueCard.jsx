import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiUsers, FiClock } from 'react-icons/fi';

export default function QueueCard({ service, queueInfo }) {
  const { darkMode } = useTheme();
  const progress = queueInfo ? Math.min(((queueInfo.totalInQueue - queueInfo.upcoming.length) / queueInfo.totalInQueue) * 100, 100) : 0;

  return (
    <motion.div
      className={`queue-card ${darkMode ? 'dark' : ''}`}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="queue-card-header">
        <div className="queue-service-icon" style={{ background: `${service.color}20`, color: service.color }}>
          <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
        </div>
        <div>
          <h3 className="queue-service-name">{service.name}</h3>
          <p className="queue-service-desc">{service.description}</p>
        </div>
      </div>

      {queueInfo && (
        <>
          <div className="queue-stats-row">
            <div className="queue-stat">
              <FiUsers size={16} />
              <span>{queueInfo.totalInQueue} in queue</span>
            </div>
            <div className="queue-stat">
              <FiClock size={16} />
              <span>~{queueInfo.avgWait} min avg</span>
            </div>
          </div>

          <div className="queue-current">
            <span className="queue-current-label">Now Serving</span>
            <span className="queue-current-token">{queueInfo.currentServing}</span>
          </div>

          <div className="queue-progress-wrapper">
            <div className="queue-progress-bar">
              <motion.div
                className="queue-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ background: service.color }}
              />
            </div>
            <span className="queue-progress-text">{Math.round(progress)}% complete</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
