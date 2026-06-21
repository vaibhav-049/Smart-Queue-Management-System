import { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useServices } from '../../hooks/useServices';
import { joinServiceRoom, getSocket } from '../../services/socket';
import api from '../../services/api';
import PriorityBadge from '../../components/PriorityBadge/PriorityBadge';
import WaitingTimeCard from '../../components/WaitingTimeCard/WaitingTimeCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

function QueueStatusDetails({ selectedService, queueInfo, darkMode }) {
  if (!queueInfo) {
    return (
      <div className="queue-status-layout">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const { currentServing, upcoming = [], totalInQueue = 0, avgWait = 10, activeTokens = [] } = queueInfo;

  
  const servingToken = activeTokens.find(t => t.displayId === currentServing);

  return (
    <div className="queue-status-layout">
      {}
      <m.div
        className="current-serving-card"
        key={currentServing || 'idle'}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="cs-header">
          <span className="cs-label">Now Serving</span>
          {currentServing && (
            <m.div
              className="cs-pulse"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="cs-token">{currentServing || 'Idle'}</div>
        {servingToken && (
          <div className="cs-details">
            <span>{servingToken.name}</span>
            <PriorityBadge priority={servingToken.priority} />
          </div>
        )}
      </m.div>

      {}
      <WaitingTimeCard
        waitTime={avgWait}
        position={currentServing ? 2 : 1}
        total={totalInQueue}
      />

      {}
      <div className="upcoming-section">
        <h3 className="section-label">Upcoming Tokens</h3>
        <div className="upcoming-list">
          <AnimatePresence>
            {upcoming.map((tokenId, index) => {
              const tokenData = activeTokens.find(t => t.displayId === tokenId);
              return (
                <m.div
                  key={tokenId}
                  className={`upcoming-token ${index === 0 ? 'next' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <div className="ut-left">
                    <span className="ut-position">#{index + 1}</span>
                    <div className="ut-info">
                      <span className="ut-token">{tokenId}</span>
                      {tokenData && <span className="ut-name">{tokenData.name}</span>}
                    </div>
                  </div>
                  <div className="ut-right">
                    {tokenData && <PriorityBadge priority={tokenData.priority} size="sm" />}
                    <span className="ut-wait">~{avgWait * (index + 1)} min</span>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
          {upcoming.length === 0 && (
            <div className="no-upcoming" style={{ textAlign: 'center', padding: '1rem', opacity: 0.7 }}>
              No other tokens in line.
            </div>
          )}
        </div>
      </div>

      {}
      <div className="queue-progress-section">
        <h3 className="section-label">Queue Progress</h3>
        <div className="queue-progress-visual">
          {activeTokens.map((token, index) => (
            <m.div
              key={token._id || token.displayId}
              className={`qp-item ${token.status}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="qp-token">{token.displayId}</span>
              <span className={`qp-status ${token.status}`}>
                {token.status === 'serving' ? '🟢' : '🟡'}
              </span>
            </m.div>
          ))}
          {activeTokens.length === 0 && (
            <div style={{ opacity: 0.7, padding: '1rem' }}>No active queue tokens.</div>
          )}
        </div>
        {activeTokens.length > 0 && (
          <>
            <div className="queue-progress-bar-full">
              <m.div
                className="queue-progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${((totalInQueue - upcoming.length) / Math.max(totalInQueue, 1)) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="queue-progress-text">
              {totalInQueue - upcoming.length} of {totalInQueue} tokens served
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function QueueStatus() {
  const { darkMode } = useTheme();
  const { services, loading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState('');
  const [queueInfo, setQueueInfo] = useState(null);

  // Update selectedService when services load
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService]);

  // Fetch detailed service queue status
  const fetchQueueStatus = useCallback(async () => {
    if (!selectedService) return;
    try {
      const response = await api.get(`/queues/${selectedService}/status`);
      if (response.data && response.data.success) {
        setQueueInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching service queue details:', err);
      toast.error('Failed to load queue details');
    }
  }, [selectedService]);

  
  useEffect(() => {
    if (!selectedService) return;
    joinServiceRoom(selectedService);
    fetchQueueStatus();
  }, [selectedService, fetchQueueStatus]);

  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleQueueUpdated = (payload) => {
      
      if (payload.service === selectedService) {
        fetchQueueStatus();
      }
    };

    socket.on('queue-updated', handleQueueUpdated);
    return () => {
      socket.off('queue-updated', handleQueueUpdated);
    };
  }, [selectedService, fetchQueueStatus]);

  return (
    <div className={`queue-status-page ${darkMode ? 'dark' : ''}`} style={{ padding: '0 0.25rem' }}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Live Queue Status</h1>
        <p>Track queue progress in real-time</p>
      </m.div>

      {}
      <div className="service-filters">
        {servicesLoading ? (
          <LoadingSkeleton type="stats" count={3} />
        ) : (
          services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedService(s.id)}
              className={`filter-btn ${selectedService === s.id ? 'active' : ''}`}
              style={{ borderColor: selectedService === s.id ? s.color : 'var(--border-color)', color: selectedService === s.id ? s.color : 'inherit' }}
            >
              <span className="filter-icon">{s.icon}</span> {s.name}
            </button>
          ))
        )}
      </div>

      <QueueStatusDetails
        key={selectedService}
        selectedService={selectedService}
        queueInfo={queueInfo}
        darkMode={darkMode}
      />
    </div>
  );
}
