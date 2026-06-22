import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FiUsers, FiShield, FiActivity, FiTrendingUp, FiTrash2, FiClock, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import InviteCodesPanel from '../AdminDashboard/InviteCodesPanel';
import './SuperAdminDashboard.css';
import { useTheme } from '../../context/ThemeContext';
import ManualTokenForm from '../AdminDashboard/ManualTokenForm';

export default function SuperAdminDashboard() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedService, setSelectedService] = useState('hospital');
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/superadmin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch super admin stats', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/superadmin/admins');
      if (res.data.success) {
        setAdmins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admins', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/superadmin/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchAdmins(), fetchCustomers()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for ${name}?`)) return;
    
    try {
      const res = await api.delete(`/superadmin/admins/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAdmins();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Super Admin Data...</div>;
  }

  return (
    <div className={`super-admin-dashboard ${darkMode ? 'dark' : ''}`}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Super Admin Control Panel</h1>
        <p>System overview and advanced management</p>
      </div>

      <div className="sa-stats-grid">
        <m.div className="sa-stat-card" whileHover={{ y: -5 }}>
          <div className="sa-stat-icon users"><FiUsers /></div>
          <div className="sa-stat-info">
            <h4>Total Customers</h4>
            <p>{stats?.totalCustomers || 0}</p>
          </div>
        </m.div>
        
        <m.div className="sa-stat-card" whileHover={{ y: -5 }}>
          <div className="sa-stat-icon admins"><FiShield /></div>
          <div className="sa-stat-info">
            <h4>Active Admins</h4>
            <p>{stats?.totalAdmins || 0}</p>
          </div>
        </m.div>

        <m.div className="sa-stat-card" whileHover={{ y: -5 }}>
          <div className="sa-stat-icon tokens"><FiActivity /></div>
          <div className="sa-stat-info">
            <h4>Total Tokens Served</h4>
            <p>{stats?.totalTokens || 0}</p>
          </div>
        </m.div>

        <m.div className="sa-stat-card" whileHover={{ y: -5 }}>
          <div className="sa-stat-icon popular"><FiTrendingUp /></div>
          <div className="sa-stat-info">
            <h4>Most Popular Service</h4>
            <p>{stats?.popularService || 'N/A'}</p>
          </div>
        </m.div>
      </div>

      <div className="sa-tabs">
        <button className={`sa-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview & Admins
        </button>
        <button className={`sa-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          Customer Directory
        </button>
        <button className={`sa-tab ${activeTab === 'invites' ? 'active' : ''}`} onClick={() => setActiveTab('invites')}>
          Manage Invites
        </button>
        <button className={`sa-tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
          Generate Token
        </button>
      </div>

      <AnimatePresence mode="wait">
        <m.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === 'overview' && (
            <div className="sa-table-container">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Admin Name</th>
                    <th>Email</th>
                    <th>Service</th>
                    <th>Tokens Handled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No admins found.</td></tr>
                  ) : (
                    admins.map(admin => (
                      <tr key={admin._id}>
                        <td style={{ fontWeight: '500' }}>{admin.name}</td>
                        <td>{admin.email}</td>
                        <td style={{ textTransform: 'capitalize' }}>{admin.service}</td>
                        <td>{admin.tokensHandled}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            <FiTrash2 /> Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="sa-table-container">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Bookings</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No customers found.</td></tr>
                  ) : (
                    customers.map(customer => (
                      <tr key={customer._id}>
                        <td>
                          <span style={{ fontWeight: '500' }}>{customer.name}</span>
                          {customer.isVip && <span className="vip-badge"><FiStar /> VIP</span>}
                        </td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.totalBookings}</td>
                        <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invites' && (
            <div>
              <InviteCodesPanel />
            </div>
          )}

          {activeTab === 'generate' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-color)' }}>Select Service to Generate Token for:</label>
                <select 
                  value={selectedService} 
                  onChange={(e) => setSelectedService(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
                >
                  <option value="hospital">Hospital</option>
                  <option value="college">College</option>
                  <option value="salon">Salon</option>
                </select>
              </div>
              <ManualTokenForm 
                selectedService={selectedService} 
                onSuccess={() => fetchStats()} 
              />
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
