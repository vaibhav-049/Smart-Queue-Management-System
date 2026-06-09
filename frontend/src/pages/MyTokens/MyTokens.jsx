import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { tokens } from '../../services/mockData';
import TokenCard from '../../components/TokenCard/TokenCard';
import QRCodeCard from '../../components/QRCodeCard/QRCodeCard';

const statusFilters = ['all', 'waiting', 'serving', 'completed', 'cancelled'];

export default function MyTokens() {
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState('all');
  const [selectedToken, setSelectedToken] = useState(null);

  // Get tokens for current user (userId: 1)
  const userTokens = tokens.filter(t => t.userId === 1);
  const filteredTokens = filter === 'all' ? userTokens : userTokens.filter(t => t.status === filter);

  return (
    <div className={`my-tokens-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>My Tokens</h1>
        <p>View and manage all your booked tokens</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {statusFilters.map(status => (
          <motion.button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="capitalize">{status}</span>
            <span className="filter-count">
              {status === 'all' ? userTokens.length : userTokens.filter(t => t.status === status).length}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tokens Grid */}
      <div className="tokens-grid">
        <AnimatePresence mode="popLayout">
          {filteredTokens.map((token, index) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <TokenCard
                token={token}
                onClick={() => setSelectedToken(selectedToken?.id === token.id ? null : token)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTokens.length === 0 && (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="empty-icon">🎫</span>
          <h3>No tokens found</h3>
          <p>You don't have any {filter !== 'all' ? filter : ''} tokens yet.</p>
        </motion.div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <QRCodeCard token={selectedToken} />
              <button className="modal-close" onClick={() => setSelectedToken(null)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
