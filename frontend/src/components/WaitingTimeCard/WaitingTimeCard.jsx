import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiClock } from 'react-icons/fi';

export default function WaitingTimeCard({ waitTime, position, total }) {
  const { darkMode } = useTheme();
  const progress = total > 0 ? ((total - position) / total) * 100 : 0;

  return (
    <m.div
      className={`waiting-card ${darkMode ? 'dark' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="waiting-card-icon">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <FiClock size={32} />
        </m.div>
      </div>
      <div className="waiting-card-info">
        <h3 className="waiting-time">{waitTime} <span>min</span></h3>
        <p className="waiting-label">Estimated Wait Time</p>
        <p className="waiting-position">Position {position} of {total}</p>
      </div>
      <div className="waiting-progress">
        <svg viewBox="0 0 100 100" className="waiting-ring">
          <circle cx="50" cy="50" r="42" className="waiting-ring-bg" />
          <m.circle
            cx="50" cy="50" r="42"
            className="waiting-ring-fill"
            strokeDasharray={`${2 * Math.PI * 42}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress / 100) }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <span className="waiting-ring-text">{Math.round(progress)}%</span>
      </div>
    </m.div>
  );
}
