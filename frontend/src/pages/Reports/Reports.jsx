import { useState, useEffect, lazy, Suspense } from 'react';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiDownload, FiCalendar, FiTrendingUp, FiClock, FiActivity } from 'react-icons/fi';


import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReportsCharts = lazy(() => import('./ReportsCharts'));

const handleExportReport = async () => {
  try {
    toast.loading('Generating report...', { id: 'export-loading' });
    const response = await api.get('/reports/download?format=csv', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `queue_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!', { id: 'export-loading' });
  } catch (err) {
    console.error('Error exporting report:', err);
    toast.error('Failed to export report', { id: 'export-loading' });
  }
};

export default function Reports() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics')
      .then((res) => {
        if (res.data && res.data.success) {
          setAnalytics(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Error loading analytics for reports:', err);
        toast.error('Failed to load reports data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className={`reports-page ${darkMode ? 'dark' : ''}`}>
        <div className="page-header"><h1>Reports</h1><p>Loading reports...</p></div>
        <div className="stats-grid"><LoadingSkeleton type="stats" count={4} /></div>
        <div className="charts-grid"><LoadingSkeleton type="chart" count={2} /></div>
      </div>
    );
  }

  const { dashboardStats, hourlyData, monthlyData, weeklyReport } = analytics;

  const totalWeeklyTokens = weeklyReport?.reduce((acc, w) => acc + w.tokens, 0) || 1;
  const totalWeeklyCompleted = weeklyReport?.reduce((acc, w) => acc + w.completed, 0) || 0;
  const completionRateOverall = ((totalWeeklyCompleted / totalWeeklyTokens) * 100).toFixed(1);

  const summaryCards = [
    { label: 'Total Tokens Generated', value: dashboardStats.totalTokens.toLocaleString(), icon: FiActivity, color: '#3B82F6' },
    { label: 'Peak Hours', value: dashboardStats.peakHour, icon: FiClock, color: '#F59E0B' },
    { label: 'Most Used Service', value: dashboardStats.mostUsedService, icon: FiTrendingUp, color: '#10B981' },
    { label: 'Average Wait Time', value: `${dashboardStats.avgWaitTime} minutes`, icon: FiClock, color: '#8B5CF6' },
  ];

  return (
    <div className={`reports-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Reports & Analytics</h1>
          <p>Comprehensive insights into your queue performance</p>
        </div>
        <m.button
          type="button"
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportReport}
        >
          <FiDownload size={18} /> Export Report
        </m.button>
      </m.div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <m.div
              key={card.label}
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
            </m.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <Suspense fallback={<LoadingSkeleton type="chart" count={2} />}>
        <ReportsCharts
          hourlyData={hourlyData}
          monthlyData={monthlyData}
          darkMode={darkMode}
        />
      </Suspense>

      {/* Weekly Report Table */}
      <m.div
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
                <m.tr
                  key={week.week}
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
                      <span>{week.tokens > 0 ? ((week.completed / week.tokens) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>

      {/* Additional Stats */}
      <div className="report-extra-grid">
        <m.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <h4>Completion Rate</h4>
          <p className="report-extra-value">{completionRateOverall}%</p>
        </m.div>
        <m.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <h4>Cancellation Rate</h4>
          <p className="report-extra-value text-red">{dashboardStats.cancellationRate}%</p>
        </m.div>
        <m.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <h4>Busiest Day</h4>
          <p className="report-extra-value">{dashboardStats.busiestDay}</p>
        </m.div>
        <m.div className="report-extra-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
          <h4>Satisfaction</h4>
          <p className="report-extra-value">{dashboardStats.avgRating}/5</p>
        </m.div>
      </div>
    </div>
  );
}
