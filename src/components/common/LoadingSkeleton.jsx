import { useTheme } from '../../context/ThemeContext';

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const { darkMode } = useTheme();

  const renderSkeleton = () => {
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-table-row">
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
              {[...Array(7)].map((_, i) => (
                <div key={i} className="skeleton-bar-item" style={{ height: `${30 + Math.random() * 50}%` }} />
              ))}
            </div>
          </div>
        );
      default:
        return <div className="skeleton-line" />;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-wrapper">{renderSkeleton()}</div>
      ))}
    </>
  );
}
