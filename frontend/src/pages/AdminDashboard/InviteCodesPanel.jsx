import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { FiPlus, FiCopy, FiCheck, FiKey, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PriorityBadge from '../../components/PriorityBadge/PriorityBadge';

export default function InviteCodesPanel() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedService, setSelectedService] = useState('hospital');
  const [copiedId, setCopiedId] = useState(null);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/invite-codes');
      if (res.data.success) {
        setCodes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching invite codes:', err);
      toast.error('Failed to load invite codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/admin/invite-codes', { service: selectedService });
      if (res.data.success) {
        toast.success(`Generated code for ${selectedService}`);
        fetchCodes(); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invite code?')) return;
    
    try {
      const res = await api.delete(`/admin/invite-codes/${id}`);
      if (res.data.success) {
        toast.success('Invite code deleted successfully');
        setCodes(codes.filter(c => c._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete code');
    }
  };

  const copyToClipboard = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <m.div
      className="activity-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{ marginTop: '2rem' }}
    >
      <div className="chart-header">
        <h3 className="flex items-center gap-2">
          <FiKey style={{ color: '#8B5CF6' }} />
          Admin Invite Codes
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-color)'
            }}
          >
            <option value="hospital">Hospital</option>
            <option value="college">College</option>
            <option value="salon">Salon</option>
          </select>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <FiPlus /> {generating ? 'Generating...' : 'Generate New'}
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loading ? (
          <p>Loading codes...</p>
        ) : codes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No invite codes generated yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 15px' }}>Code</th>
                <th style={{ padding: '10px 15px' }}>Service</th>
                <th style={{ padding: '10px 15px' }}>Status</th>
                <th style={{ padding: '10px 15px' }}>Created</th>
                <th style={{ padding: '10px 15px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 15px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {c.code}
                  </td>
                  <td style={{ padding: '10px 15px', textTransform: 'capitalize' }}>
                    {c.service}
                  </td>
                  <td style={{ padding: '10px 15px' }}>
                    {c.isUsed ? (
                      <span style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 'bold' }}>Used by {c.usedBy?.name || 'Unknown'}</span>
                    ) : (
                      <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 'bold' }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 15px', color: 'var(--text-muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 15px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {!c.isUsed && (
                        <button
                          onClick={() => copyToClipboard(c._id, c.code)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedId === c._id ? '#10B981' : '#3B82F6',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {copiedId === c._id ? <FiCheck /> : <FiCopy />} Copy
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </m.div>
  );
}
