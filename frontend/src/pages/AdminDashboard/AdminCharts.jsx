import { m } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminCharts({ dailyQueueData, serviceUsageData, darkMode }) {
  return (
    <div className="charts-grid">
      {}
      <m.div
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
      </m.div>

      {}
      <m.div
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
              {serviceUsageData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
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
      </m.div>
    </div>
  );
}
