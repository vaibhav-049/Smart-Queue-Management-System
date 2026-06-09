import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import PriorityBadge from '../PriorityBadge/PriorityBadge';

const statusColors = {
  waiting: { bg: 'var(--status-waiting-bg)', text: 'var(--status-waiting)', label: 'Waiting' },
  serving: { bg: 'var(--status-serving-bg)', text: 'var(--status-serving)', label: 'Serving' },
  completed: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed)', label: 'Completed' },
  cancelled: { bg: 'var(--status-cancelled-bg)', text: 'var(--status-cancelled)', label: 'Cancelled' },
};

export default function TokenCard({ token, onClick, compact = false }) {
  const { darkMode } = useTheme();
  const status = statusColors[token.status] || statusColors.waiting;

  return (
    <motion.div
      className={`token-card ${darkMode ? 'dark' : ''} ${compact ? 'compact' : ''}`}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      layout
    >
      <div className="token-card-header">
        <div className="token-id-wrapper">
          <span className="token-id">{token.id}</span>
          <PriorityBadge priority={token.priority} />
        </div>
        <span className="token-status" style={{ background: status.bg, color: status.text }}>
          {status.label}
        </span>
      </div>

      {!compact && (
        <div className="token-card-body">
          <div className="token-detail">
            <span className="token-label">Service</span>
            <span className="token-value">{token.service}</span>
          </div>
          <div className="token-detail">
            <span className="token-label">Position</span>
            <span className="token-value">#{token.position}</span>
          </div>
          <div className="token-detail">
            <span className="token-label">Wait Time</span>
            <span className="token-value">{token.waitTime} min</span>
          </div>
          {token.timeSlot && (
            <div className="token-detail">
              <span className="token-label">Time Slot</span>
              <span className="token-value">{token.timeSlot}</span>
            </div>
          )}
        </div>
      )}

      {compact && (
        <div className="token-card-compact">
          <span>Position: #{token.position}</span>
          <span>{token.waitTime} min wait</span>
        </div>
      )}
    </motion.div>
  );
}
