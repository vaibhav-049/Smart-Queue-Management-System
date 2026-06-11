import { m, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

function AnimatedCounter({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return <m.span>{rounded}</m.span>;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, color = '#3B82F6', suffix = '' }) {
  const { darkMode } = useTheme();

  return (
    <m.div
      className={`stats-card ${darkMode ? 'dark' : ''}`}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div className="stats-card-top">
        <div>
          <p className="stats-title">{title}</p>
          <h3 className="stats-value">
            <AnimatedCounter value={value} />
            {suffix && <span className="stats-suffix">{suffix}</span>}
          </h3>
        </div>
        <div className="stats-icon-wrapper" style={{ background: `${color}15`, color }}>
          {Icon && <Icon size={24} />}
        </div>
      </div>
      {trend && (
        <div className={`stats-trend ${trend === 'up' ? 'positive' : 'negative'}`}>
          <span>{trend === 'up' ? '↑' : '↓'} {trendValue}</span>
          <span className="stats-trend-label">vs last week</span>
        </div>
      )}
    </m.div>
  );
}
