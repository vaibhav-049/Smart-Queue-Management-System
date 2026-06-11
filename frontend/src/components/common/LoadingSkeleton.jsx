import { useTheme } from '../../context/ThemeContext';

function SkeletonItem({ type, darkMode }) {
  switch (type) {
    case 'card':
      return (
        <div className={`skeleton-card ${darkMode ? 'dark' : ''}`}>
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text short" />
          <div className="skeleton-line skeleton-bar" />
        </div>
      );
    case 'stats':
      return (
        <div className={`skeleton-card skeleton-stats ${darkMode ? 'dark' : ''}`}>
          <div className="skeleton-line skeleton-text short" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-text" />
        </div>
      );
    case 'table':
      return (
        <div className={`skeleton-table ${darkMode ? 'dark' : ''}`}>
          {[0, 1, 2, 3, 4].map((rowId) => (
            <div key={rowId} className="skeleton-table-row">
              <div className="skeleton-line skeleton-cell" />
              <div className="skeleton-line skeleton-cell wide" />
              <div className="skeleton-line skeleton-cell" />
              <div className="skeleton-line skeleton-cell" />
            </div>
          ))}
        </div>
      );
    case 'chart':
      return (
        <div className={`skeleton-chart ${darkMode ? 'dark' : ''}`}>
          <div className="skeleton-line skeleton-title short" />
          <div className="skeleton-chart-bars">
            {[0, 1, 2, 3, 4, 5, 6].map((barId) => (
              <div key={barId} className="skeleton-bar-item" style={{ height: `${30 + ((barId * 17) % 50)}%` }} />
            ))}
          </div>
        </div>
      );
    default:
      return <div className="skeleton-line" />;
  }
}

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const { darkMode } = useTheme();
  const items = Array.from({ length: count }, (_, i) => `skeleton-${type}-${i}`);

  return (
    <>
      {items.map((itemId) => (
        <div key={itemId} className="skeleton-wrapper">
          <SkeletonItem type={type} darkMode={darkMode} />
        </div>
      ))}
    </>
  );
}
