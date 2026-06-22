import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useServices } from '../../hooks/useServices';
import { initiateSocket, getSocket } from '../../services/socket';
import api from '../../services/api';
import { getCached, setCache } from '../../utils/apiCache';
import StatsCard from '../../components/StatsCard/StatsCard';
import PriorityBadge from '../../components/PriorityBadge/PriorityBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { FiTag, FiList, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiPlay, FiAlertCircle, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import InviteCodesPanel from './InviteCodesPanel';

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
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  
  
  const { services, loading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState('');
  const [serviceQueue, setServiceQueue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Update selectedService when services load
  useEffect(() => {
    if (user?.service) {
      setSelectedService(user.service.toLowerCase());
    } else if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService, user]);

  // Fetch Dashboard Analytics
  const fetchAnalytics = useCallback(async () => {
    const cachedAnalytics = getCached('admin-analytics');
    if (cachedAnalytics) {
      setAnalytics(cachedAnalytics);
      setLoading(false);
    }

    try {
      const response = await api.get('/admin/analytics');
      if (response.data && response.data.success) {
        setAnalytics(response.data.data);
        setCache('admin-analytics', response.data.data, 2 * 60 * 1000); 
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      if (!cachedAnalytics) toast.error('Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  
  const fetchServiceQueue = useCallback(async () => {
    if (!selectedService) return;
    const cacheKey = `queue-status-${selectedService}`;
    const cachedQueue = getCached(cacheKey);
    if (cachedQueue) {
      setServiceQueue(cachedQueue);
    }

    try {
      const response = await api.get(`/queues/${selectedService}/status`);
      if (response.data && response.data.success) {
        setServiceQueue(response.data.data);
        setCache(cacheKey, response.data.data, 2 * 60 * 1000); 
      }
    } catch (err) {
      console.error('Error fetching service queue details:', err);
    }
  }, [selectedService]);

  
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchServiceQueue();
  }, [fetchServiceQueue]);

  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleQueueUpdated = (payload) => {
      
      fetchAnalytics();
      if (payload.service === selectedService) {
        fetchServiceQueue();
      }
    };

    socket.on('queue-updated', handleQueueUpdated);
    return () => {
      socket.off('queue-updated', handleQueueUpdated);
    };
  }, [selectedService, fetchAnalytics, fetchServiceQueue]);

  
  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const response = await api.post(`/admin/queues/${selectedService}/next`);
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchServiceQueue();
        fetchAnalytics();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to call next token';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCurrent = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/admin/complete-token', { service: selectedService });
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchServiceQueue();
        fetchAnalytics();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to complete token';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipToken = async (tokenId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/admin/queues/${selectedService}/skip/${tokenId}`);
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchServiceQueue();
        fetchAnalytics();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to skip token';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleQueueActive = async (currentActive) => {
    setActionLoading(true);
    const endpoint = currentActive ? 'close' : 'open';
    try {
      const response = await api.post(`/admin/queues/${selectedService}/${endpoint}`);
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchServiceQueue();
        fetchAnalytics();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to toggle queue status';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !analytics) {
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

  const { dashboardStats, serviceUsageData, dailyQueueData, recentActivity } = analytics;
  const currentServing = serviceQueue?.currentServing;
  const activeTokens = serviceQueue?.activeTokens || [];
  const servingTokenData = activeTokens.find(t => t.displayId === currentServing);
  const upcomingTokens = activeTokens.filter(t => t.status === 'waiting');

  return (
    <div className={`admin-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'Administrator'}! You are logged in as <strong>{user?.service ? `${services.find(s => s.id === user.service.toLowerCase())?.name || user.service} Admin` : 'Super Admin'}</strong>.</p>
        </div>
        <div>
          <Link
            to="/admin/scanner"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              background: '#8B5CF6',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}
          >
            📷 QR Verification Scanner
          </Link>
        </div>
      </m.div>

      {}
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

      {}
      <Suspense fallback={<LoadingSkeleton type="chart" count={2} />}>
        <AdminCharts
          dailyQueueData={dailyQueueData}
          serviceUsageData={serviceUsageData}
          darkMode={darkMode}
        />
      </Suspense>

      {}
      <m.div
        className="activity-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: '2rem', marginBottom: '2rem' }}
      >
        <div className="chart-header">
          <h3 className="flex items-center gap-2">
            <FiSettings style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} />
            Queue Control Panel Console
          </h3>
          <div className="flex gap-2">
            {servicesLoading ? (
              <span className="text-sm">Loading services...</span>
            ) : user?.service ? (
              <span className="filter-tab active" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'default' }}>
                {services.find(s => s.id === user.service.toLowerCase())?.icon || '🏢'} {services.find(s => s.id === user.service.toLowerCase())?.name || user.service}
              </span>
            ) : (
              services.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(s.id)}
                  className={`filter-tab ${selectedService === s.id ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {s.icon} {s.name}
                </button>
              ))
            )}
          </div>
        </div>

        {serviceQueue && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              
              {}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', background: 'var(--card-bg)' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Currently Serving</span>
                <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: currentServing ? 'var(--status-serving)' : 'var(--text-muted)' }}>
                  {currentServing || 'Idle'}
                </h2>
                {servingTokenData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                    <p><strong>Customer:</strong> {servingTokenData.name}</p>
                    <p><strong>Phone:</strong> {servingTokenData.phone}</p>
                    <p><strong>Slot:</strong> {servingTokenData.timeSlot}</p>
                    <div style={{ marginTop: '0.25rem' }}><PriorityBadge priority={servingTokenData.priority} size="sm" /></div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No token is currently active.</p>
                )}
              </div>

              {}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={actionLoading || upcomingTokens.length === 0}
                    onClick={handleCallNext}
                    className="btn-primary-full"
                    style={{ flex: '1 1 140px', padding: '12px', background: '#3B82F6' }}
                  >
                    📞 Call Next
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || !currentServing}
                    onClick={handleCompleteCurrent}
                    className="btn-primary-full"
                    style={{ flex: '1 1 140px', padding: '12px', background: '#10B981' }}
                  >
                    ✅ Complete
                  </button>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => toggleQueueActive(serviceQueue.isActive)}
                  className="btn-outline"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderColor: serviceQueue.isActive ? '#EF4444' : '#10B981',
                    color: serviceQueue.isActive ? '#EF4444' : '#10B981',
                    background: 'transparent',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {serviceQueue.isActive ? '🔴 Close Bookings (Pause)' : '🟢 Open Bookings (Resume)'}
                </button>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.innerWidth <= 768) {
                      toast.error('TV Display can only be opened on laptops or large screens.');
                      return;
                    }
                    window.open(`/tv-display/${selectedService}`, '_blank');
                  }}
                  className="btn-outline" 
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)',
                    background: 'transparent',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                >
                  📺 Open TV Display (New Tab)
                </button>
              </div>
            </div>

            {}
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>Upcoming Customers in Line ({upcomingTokens.length})</h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 15px' }}>Position</th>
                      <th style={{ padding: '10px 15px' }}>Token</th>
                      <th style={{ padding: '10px 15px' }}>Customer Name</th>
                      <th style={{ padding: '10px 15px' }}>Priority</th>
                      <th style={{ padding: '10px 15px' }}>Slot</th>
                      <th style={{ padding: '10px 15px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTokens.map((token, idx) => (
                      <tr key={token._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 15px' }}>#{idx + 1}</td>
                        <td style={{ padding: '10px 15px', fontWeight: 'bold' }}>{token.displayId}</td>
                        <td style={{ padding: '10px 15px' }}>{token.name}</td>
                        <td style={{ padding: '10px 15px' }}><PriorityBadge priority={token.priority} size="sm" /></td>
                        <td style={{ padding: '10px 15px' }}>{token.timeSlot}</td>
                        <td style={{ padding: '10px 15px', textAlign: 'right' }}>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleSkipToken(token._id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #EF4444',
                              color: '#EF4444',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Skip / Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                    {upcomingTokens.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No customers waiting in line.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </m.div>

      {}
      <m.div
        className="activity-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="chart-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <m.div
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
            </m.div>
          ))}
        </div>
      </m.div>

      {}
      {!user?.service && (
        <InviteCodesPanel />
      )}
    </div>
  );
}
