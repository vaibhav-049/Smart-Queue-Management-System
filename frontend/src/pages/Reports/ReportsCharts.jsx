import { m } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function ReportsCharts({ hourlyData, monthlyData, darkMode, onMonthRangeChange, monthRange, isSuperAdmin }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [];
  for (let y = currentYear; y >= currentYear - 3; y--) {
    years.push(y);
  }

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    background: darkMode ? '#1e293b' : '#fff',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    fontSize: '0.85rem',
    cursor: 'pointer',
    outline: 'none',
  };

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
      </m.div>

      {}
      <m.div
        className="chart-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="chart-header">
          <h3>Monthly Token Trend</h3>
          {isSuperAdmin && monthRange ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={monthRange.startMonth}
                onChange={(e) => onMonthRangeChange({ ...monthRange, startMonth: parseInt(e.target.value) })}
                style={selectStyle}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={monthRange.startYear}
                onChange={(e) => onMonthRangeChange({ ...monthRange, startYear: parseInt(e.target.value) })}
                style={selectStyle}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.85rem', color: darkMode ? '#94a3b8' : '#64748b' }}>to</span>
              <select
                value={monthRange.endMonth}
                onChange={(e) => onMonthRangeChange({ ...monthRange, endMonth: parseInt(e.target.value) })}
                style={selectStyle}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={monthRange.endYear}
                onChange={(e) => onMonthRangeChange({ ...monthRange, endYear: parseInt(e.target.value) })}
                style={selectStyle}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <span className="chart-badge">
              {monthlyData.length > 0
                ? `${monthlyData[0]?.month} – ${monthlyData[monthlyData.length - 1]?.month}`
                : '6 Months'}
            </span>
          )}
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
      </m.div>
    </div>
  );
}
