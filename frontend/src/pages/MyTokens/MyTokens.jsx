import { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import TokenCard from '../../components/TokenCard/TokenCard';
import QRCodeCard from '../../components/QRCodeCard/QRCodeCard';
import toast from 'react-hot-toast';

const statusFilters = ['all', 'waiting', 'serving', 'completed', 'cancelled'];

export default function MyTokens() {
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState('all');
  const [selectedToken, setSelectedToken] = useState(null);
  const [myTokens, setMyTokens] = useState([]);

  // Fetch tokens from backend
  const fetchTokens = useCallback(async () => {
    try {
      const response = await api.get('/tokens/my-tokens');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map(t => ({
          ...t,
          id: t.displayId, // ensures compatibility with TokenCard.id
        }));
        setMyTokens(mapped);
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      toast.error('Failed to load your tokens');
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Real-time socket token update listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTokenUpdate = (payload) => {
      setMyTokens(prev => prev.map(t => {
        if (t.displayId === payload.displayId) {
          const updated = { ...t, ...payload.data };
          // If the selected token is updated, update the modal details too
          if (selectedToken && selectedToken.displayId === payload.displayId) {
            setSelectedToken(updated);
          }
          return updated;
        }
        return t;
      }));
    };

    socket.on('token_update', handleTokenUpdate);
    return () => {
      socket.off('token_update', handleTokenUpdate);
    };
  }, [selectedToken]);

  // Cancel token booking handler
  const handleCancelToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this token booking?')) return;
    try {
      const response = await api.put(`/tokens/${tokenId}/cancel`);
      if (response.data && response.data.success) {
        toast.success('Token cancelled successfully');
        setSelectedToken(null);
        fetchTokens();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel token';
      toast.error(errMsg);
    }
  };

  const filteredTokens = filter === 'all' ? myTokens : myTokens.filter(t => t.status === filter);

  return (
    <div className={`my-tokens-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>My Tokens</h1>
        <p>View and manage all your booked tokens</p>
      </m.div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ WebkitOverflowScrolling: 'touch' }}>
        {statusFilters.map(status => (
          <m.button
            type="button"
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="capitalize">{status}</span>
            <span className="filter-count">
              {status === 'all' ? myTokens.length : myTokens.filter(t => t.status === status).length}
            </span>
          </m.button>
        ))}
      </div>

      {/* Tokens Grid */}
      <div className="tokens-grid">
        <AnimatePresence mode="popLayout">
          {filteredTokens.map((token, index) => (
            <m.div
              key={token._id || token.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <TokenCard
                token={token}
                onClick={() => setSelectedToken(selectedToken?.displayId === token.displayId ? null : token)}
              />
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTokens.length === 0 && (
        <m.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="empty-icon">🎫</span>
          <h3>No tokens found</h3>
          <p>You don't have any {filter !== 'all' ? filter : ''} tokens yet.</p>
        </m.div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedToken && (
          <m.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedToken(null)}
          >
            <m.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <QRCodeCard token={selectedToken} />
              
              {(selectedToken.status === 'waiting' || selectedToken.status === 'serving') && (
                <button
                  type="button"
                  onClick={() => handleCancelToken(selectedToken._id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#EF4444',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  ❌ Cancel Token Booking
                </button>
              )}

              <button
                className="modal-close"
                onClick={() => setSelectedToken(null)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                Close
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
