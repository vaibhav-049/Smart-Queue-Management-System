import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import PriorityBadge from '../PriorityBadge/PriorityBadge';

const statusColors = {
  waiting: { bg: 'var(--status-waiting-bg)', text: 'var(--status-waiting)', label: 'Waiting' },
  serving: { bg: 'var(--status-serving-bg)', text: 'var(--status-serving)', label: 'Serving' },
  completed: { bg: 'var(--status-completed-bg)', text: 'var(--status-completed)', label: 'Completed' },
  cancelled: { bg: 'var(--status-cancelled-bg)', text: 'var(--status-cancelled)', label: 'Cancelled' },
};

const formatBookingDate = (dateStr) => {
  if (!dateStr) return '';
  const today = new Date();
  const getFormat = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayStr = getFormat(today);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getFormat(tomorrow);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = getFormat(dayAfter);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  if (dateStr === dayAfterStr) return 'Day After Tomorrow';
  
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {}
  
  return dateStr;
};

export default function TokenCard({ token, onClick, compact = false }) {
  const { darkMode } = useTheme();
  const status = statusColors[token.status] || statusColors.waiting;

  return (
    <m.div
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
            <span className="token-value capitalize">{token.service}</span>
          </div>
          <div className="token-detail">
            <span className="token-label">Position</span>
            <span className="token-value">{token.position > 0 ? `#${token.position}` : '—'}</span>
          </div>
          <div className="token-detail">
            <span className="token-label">Wait Time</span>
            <span className="token-value">{token.position > 0 ? `${token.waitTime} min` : '—'}</span>
          </div>
          {token.bookingDate && (
            <div className="token-detail">
              <span className="token-label">Date</span>
              <span className="token-value">{formatBookingDate(token.bookingDate)}</span>
            </div>
          )}
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
          <span>{token.position > 0 ? `Position: #${token.position}` : 'Completed/Cancelled'}</span>
          <span>{token.position > 0 ? `${token.waitTime} min wait` : '—'}</span>
        </div>
      )}
    </m.div>
  );
}
