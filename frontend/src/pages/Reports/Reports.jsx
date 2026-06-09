import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  reportData, hourlyData, monthlyData, serviceUsageData, weeklyReport
} from '../../services/mockData';
import { FiDownload, FiCalendar, FiTrendingUp, FiClock, FiActivity } from 'react-icons/fi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

export default function Reports() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const summaryCards = [
    { label: 'Total Tokens Generated', value: reportData.totalTokensGenerated.toLocaleString(), icon: FiActivity, color: '#3B82F6' },
    { label: 'Peak Hours', value: reportData.peakHours, icon: FiClock, color: '#F59E0B' },
    { label: 'Most Used Service', value: reportData.mostUsedService, icon: FiTrendingUp, color: '#10B981' },
    { label: 'Average Wait Time', value: reportData.avgWaitTime, icon: FiClock, color: '#8B5CF6' },
  ];

  if (loading) {
    return (
      <div className={`reports-page ${darkMode ? 'dark' : ''}`}>
        <div className="page-header"><h1>Reports</h1><p>Loading reports...</p></div>
        <div className="stats-grid"><LoadingSkeleton type="stats" count={4} /></div>
        <div className="charts-grid"><LoadingSkeleton type="chart" count={2} /></div>
      </div>
    );
  }

  return (
    <div className={`reports-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Reports & Analytics</h1>
          <p>Comprehensive insights into your queue performance</p>
        </div>
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast.success('Report exported successfully!')}
        >
          <FiDownload size={18} /> Export Report
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              className="report-summary-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="rsc-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="rsc-info">
                <p className="rsc-label">{card.label}</p>
                <h3 className="rsc-value">{card.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Hourly Traffic */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Hourly Visitor Traffic</h3>
            <span className="chart-badge">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="hour" stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1e293b' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Bar dataKey="visitors" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Monthly Token Trend</h3>
            <span className="chart-badge">6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1e293b' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Line type="monotone" dataKey="tokens" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Weekly Report Table */}
      <motion.div
        className="report-table-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="chart-header">
          <h3>Weekly Report Summary</h3>
          <span className="chart-badge"><FiCalendar size={14} /> This Month</span>
        </div>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Tokens Generated</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {weeklyReport.map((week, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <td className="font-medium">{week.week}</td>
                  <td>{week.tokens.toLocaleString()}</td>
                  <td className="text-green">{week.completed.toLocaleString()}</td>
                  <td className="text-red">{week.cancelled}</td>
                  <td>
                    <div className="completion-bar-wrapper">
                      <div className="completion-bar">
                        <div
                          className="completion-fill"
                          style={{ width: `${(week.completed / week.tokens) * 100}%` }}
                        />
                      </div>
                      <span>{((week.completed / week.tokens) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Additional Stats */}
      <div className="report-extra-grid">
        <motion.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <h4>Completion Rate</h4>
          <p className="report-extra-value">{reportData.completionRate}</p>
        </motion.div>
        <motion.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <h4>Cancellation Rate</h4>
          <p className="report-extra-value text-red">{reportData.cancellationRate}</p>
        </motion.div>
        <motion.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <h4>Busiest Day</h4>
          <p className="report-extra-value">{reportData.busiestDay}</p>
        </motion.div>
        <motion.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
          <h4>Satisfaction</h4>
          <p className="report-extra-value">{reportData.customerSatisfaction}</p>
        </motion.div>
      </div>
    </div>
  );
}
