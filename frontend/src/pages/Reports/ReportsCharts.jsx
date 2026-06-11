import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function ReportsCharts({ hourlyData, monthlyData, darkMode }) {
  return (
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
  );
}
