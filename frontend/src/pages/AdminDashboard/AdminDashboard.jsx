import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  dashboardStats, dailyQueueData, serviceUsageData, recentActivity
} from '../../services/mockData';
import StatsCard from '../../components/StatsCard/StatsCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { FiTag, FiList, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiPlay } from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function AdminDashboard() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
      <div className="charts-grid">
        {/* Daily Queue Analysis */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Daily Queue Analysis</h3>
            <span className="chart-badge">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyQueueData}>
              <defs>
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#3B82F6" fill="url(#tokenGradient)" strokeWidth={2} name="Tokens" />
              <Area type="monotone" dataKey="waitTime" stroke="#10B981" fill="url(#waitGradient)" strokeWidth={2} name="Avg Wait (min)" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Service Usage */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Service Usage Analytics</h3>
            <span className="chart-badge">All Time</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceUsageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {serviceUsageData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1e293b' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="activity-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="chart-header">
          <h3>Recent Activity</h3>
          <button className="btn-text">View All</button>
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
