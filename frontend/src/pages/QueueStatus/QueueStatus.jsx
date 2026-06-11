import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { tokens, queueData, services } from '../../services/mockData';
import PriorityBadge from '../../components/PriorityBadge/PriorityBadge';
import WaitingTimeCard from '../../components/WaitingTimeCard/WaitingTimeCard';

function QueueStatusDetails({ selectedService, currentQueue, totalInQueue, darkMode }) {
  const [queueState, setQueueState] = useState(() => {
    const q = queueData[selectedService] || queueData.hospital;
    return {
      currentToken: q.currentServing,
      upcomingTokens: q.upcoming,
    };
  });

  // Simulate real-time queue movement
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueState(prev => {
        if (prev.upcomingTokens.length <= 1) return prev;
        const next = [...prev.upcomingTokens];
        const nextToken = next[0];
        next.shift();
        return {
          currentToken: nextToken,
          upcomingTokens: next,
        };
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const servingToken = tokens.find(t => t.id === queueState.currentToken);

  return (
    <div className="queue-status-layout">
      {/* Current Serving */}
      <motion.div
        className="current-serving-card"
        key={queueState.currentToken}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="cs-header">
          <span className="cs-label">Now Serving</span>
          <motion.div
            className="cs-pulse"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div className="cs-token">{queueState.currentToken}</div>
        {servingToken && (
          <div className="cs-details">
            <span>{servingToken.name}</span>
            <PriorityBadge priority={servingToken.priority} />
          </div>
        )}
      </motion.div>

      {/* Waiting Time */}
      <WaitingTimeCard
        waitTime={currentQueue.avgWait}
        position={2}
        total={totalInQueue}
      />

      {/* Upcoming Tokens */}
      <div className="upcoming-section">
        <h3 className="section-label">Upcoming Tokens</h3>
        <div className="upcoming-list">
          <AnimatePresence>
            {queueState.upcomingTokens.map((tokenId, index) => {
              const tokenData = tokens.find(t => t.id === tokenId);
              return (
                <motion.div
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
                    <span className="ut-wait">~{currentQueue.avgWait * (index + 1)} min</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Queue Progress */}
      <div className="queue-progress-section">
        <h3 className="section-label">Queue Progress</h3>
        <div className="queue-progress-visual">
          {tokens.filter(t => t.service === selectedService && (t.status === 'waiting' || t.status === 'serving')).map((token, index) => (
            <motion.div
              key={token.id}
              className={`qp-item ${token.status}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="qp-token">{token.id}</span>
              <span className={`qp-status ${token.status}`}>
                {token.status === 'serving' ? '🟢' : '🟡'}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="queue-progress-bar-full">
          <motion.div
            className="queue-progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((totalInQueue - queueState.upcomingTokens.length) / Math.max(totalInQueue, 1)) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="queue-progress-text">
          {totalInQueue - queueState.upcomingTokens.length} of {totalInQueue} tokens served
        </p>
      </div>
    </div>
  );
}

export default function QueueStatus() {
  const { darkMode } = useTheme();
  const [selectedService, setSelectedService] = useState('hospital');

  const currentQueue = queueData[selectedService] || queueData.hospital;
  const queueTokens = tokens.filter(t => t.service === selectedService && (t.status === 'waiting' || t.status === 'serving'));
  const totalInQueue = queueTokens.length;

  return (
    <div className={`queue-status-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Live Queue Status</h1>
        <p>Track queue progress in real-time</p>
      </motion.div>

      {/* Service Tabs */}
      <div className="service-tabs">
        {services.map(service => (
          <motion.button
            type="button"
            key={service.id}
            className={`service-tab ${selectedService === service.id ? 'active' : ''}`}
            onClick={() => setSelectedService(service.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={selectedService === service.id ? { borderColor: service.color, color: service.color } : {}}
          >
            <span>{service.icon}</span> {service.name}
          </motion.button>
        ))}
      </div>

      <QueueStatusDetails
        key={selectedService}
        selectedService={selectedService}
        currentQueue={currentQueue}
        totalInQueue={totalInQueue}
        darkMode={darkMode}
      />
    </div>
  );
}
