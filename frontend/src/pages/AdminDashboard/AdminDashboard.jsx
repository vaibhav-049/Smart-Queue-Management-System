import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  dashboardStats, dailyQueueData, serviceUsageData, recentActivity
} from '../../services/mockData';
import StatsCard from '../../components/StatsCard/StatsCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { FiTag, FiList, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiPlay } from 'react-icons/fi';

const AdminCharts = lazy(() => import('./AdminCharts'));

const activityIcons = {
  create: <FiTag size={16} />,
  serve: <FiPlay size={16} />,
  complete: <FiCheckCircle size={16} />,
  cancel: <FiXCircle size={16} />,
};

const activityColors = {
  create: '#3B82F6',
  serve: '#F59E0B',
  complete: '#10B981',
  cancel: '#EF4444',
};

export default function AdminDashboard() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`admin-page ${darkMode ? 'dark' : ''}`}>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Loading your analytics...</p>
        </div>
        <div className="stats-grid">
          <LoadingSkeleton type="stats" count={4} />
        </div>
        <div className="charts-grid">
          <LoadingSkeleton type="chart" count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Vikram! Here's what's happening today.</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatsCard
          title="Total Tokens"
          value={dashboardStats.totalTokens}
          icon={FiTag}
          trend="up"
          trendValue="12.5%"
          color="#3B82F6"
        />
        <StatsCard
          title="Active Queues"
          value={dashboardStats.activeQueues}
          icon={FiList}
          trend="up"
          trendValue="2"
          color="#8B5CF6"
        />
        <StatsCard
          title="Today's Visitors"
          value={dashboardStats.todaysVisitors}
          icon={FiUsers}
          trend="up"
          trendValue="8.2%"
          color="#10B981"
        />
        <StatsCard
          title="Avg Wait Time"
          value={dashboardStats.avgWaitTime}
          icon={FiClock}
          trend="down"
          trendValue="3.1%"
          color="#F59E0B"
          suffix=" min"
        />
      </div>

      {/* Charts */}
      <Suspense fallback={<LoadingSkeleton type="chart" count={2} />}>
        <AdminCharts
          dailyQueueData={dailyQueueData}
          serviceUsageData={serviceUsageData}
          darkMode={darkMode}
        />
      </Suspense>

      {/* Recent Activity */}
      <motion.div
        className="activity-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="chart-header">
          <h3>Recent Activity</h3>
          <button type="button" className="btn-text">View All</button>
        </div>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="activity-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              <div className="activity-icon" style={{ background: `${activityColors[activity.type]}15`, color: activityColors[activity.type] }}>
                {activityIcons[activity.type]}
              </div>
              <div className="activity-info">
                <p className="activity-action">{activity.action}</p>
                <p className="activity-meta">{activity.user} · {activity.service}</p>
              </div>
              <span className="activity-time">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
