import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { initiateSocket, disconnectSocket, joinServiceRoom } from '../../services/socket';
import './TVDisplay.css';

export default function TVDisplay() {
  const { service } = useParams();
  const [queueData, setQueueData] = useState({
    currentServing: null,
    upcoming: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ref to keep track of the last announced token to avoid repeating
  const lastAnnouncedRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/queues/${service}/status`);
      if (res.data.success) {
        setQueueData({
          currentServing: res.data.data.currentServing,
          upcoming: res.data.data.upcoming || [],
          isActive: res.data.data.isActive !== false,
        });
      }
    } catch (err) {
      console.error('Error fetching TV display data:', err);
      setError('Could not load queue status. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();

    // Setup Socket.io - connect without token for public tracking
    const socket = initiateSocket(null);
    if (socket) {
      joinServiceRoom(service);

      socket.on('queue_updated', (data) => {
        if (data.service === service) {
          setQueueData((prev) => ({
            ...prev,
            currentServing: data.currentServing,
            upcoming: data.upcoming || [],
          }));
        }
      });
      // also listen to legacy 'queue-updated' if emitted
      socket.on('queue-updated', (data) => {
        if (data && data.service === service) {
           fetchQueueStatus(); // fallback if payload is missing full data
        }
      });
    }

    // Refresh data every 30 seconds as fallback
    const interval = setInterval(fetchQueueStatus, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('queue_updated');
        socket.off('queue-updated');
        socket.emit('leave_service_room', service);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  // Audio Announcement (Text-to-Speech)
  useEffect(() => {
    const currentTokenId = typeof queueData.currentServing === 'string' ? queueData.currentServing : queueData.currentServing?.displayId;
    
    if (currentTokenId && currentTokenId !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = currentTokenId;
      
      // We check if SpeechSynthesis is supported
      if ('speechSynthesis' in window) {
        // Stop any currently playing speech to avoid overlap
        window.speechSynthesis.cancel();

        // Create a polite chime/bell effect followed by speech
        const message = new SpeechSynthesisUtterance(
          `Token number ${currentTokenId}. Please proceed to the counter.`
        );
        message.rate = 0.9; // Slightly slower for clarity
        message.pitch = 1;
        
        // Wait a slight delay so UI updates first
        setTimeout(() => {
          window.speechSynthesis.speak(message);
        }, 500);
      }
    }
  }, [queueData.currentServing]);

  if (loading && !queueData.currentServing && queueData.upcoming.length === 0) {
    return (
      <div className="tv-loading">
        <div className="tv-spinner"></div>
        <h2>Loading Display...</h2>
      </div>
    );
  }

  const { currentServing, upcoming, isActive } = queueData;

  return (
    <div className="tv-container">
      {/* Header */}
      <header className="tv-header">
        <div className="tv-logo">
          <span className="logo-icon">Q</span>
          <h1>SmartQueue</h1>
        </div>
        <div className="tv-service-name">
          {service.charAt(0).toUpperCase() + service.slice(1)} Department
        </div>
        <div className="tv-clock">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* Main Content */}
      <main className="tv-main">
        {/* Left Side: Now Serving */}
        <section className="tv-now-serving">
          <div className="tv-card serving-card">
            <h2>NOW SERVING</h2>
            
            {!isActive ? (
              <div className="tv-empty-state">Counter Closed</div>
            ) : currentServing ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={typeof currentServing === 'string' ? currentServing : currentServing.displayId}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -50 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="tv-serving-number"
                >
                  <div className="tv-number-text">{typeof currentServing === 'string' ? currentServing : currentServing.displayId}</div>
                  {typeof currentServing !== 'string' && currentServing.priorityType === 'VIP' && (
                    <div className="tv-vip-badge">VIP</div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="tv-empty-state">Waiting for next token...</div>
            )}
            
            {currentServing && (
              <div className="tv-serving-details">
                Please proceed to Counter
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Next In Line */}
        <section className="tv-next-in-line">
          <div className="tv-card upcoming-card">
            <h2>NEXT IN LINE</h2>
            
            <div className="tv-upcoming-list">
              <AnimatePresence>
                {upcoming.slice(0, 5).map((token, index) => (
                  <motion.div
                    key={typeof token === 'string' ? token : token.displayId}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`tv-upcoming-item ${typeof token !== 'string' && token.priorityType === 'VIP' ? 'vip' : ''}`}
                  >
                    <span className="tv-upcoming-rank">#{index + 1}</span>
                    <span className="tv-upcoming-number">{typeof token === 'string' ? token : token.displayId}</span>
                    {typeof token !== 'string' && token.priorityType === 'VIP' && (
                      <span className="tv-upcoming-badge">VIP</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {upcoming.length === 0 && isActive && (
                <div className="tv-empty-queue">Queue is currently empty</div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Ticker */}
      <footer className="tv-footer">
        <div className="tv-ticker-wrap">
          <div className="tv-ticker">
            <div className="tv-ticker-item">Welcome to SmartQueue System.</div>
            <div className="tv-ticker-item">Please wait for your token number to be called.</div>
            <div className="tv-ticker-item">VIP tokens hold priority in the queue.</div>
            <div className="tv-ticker-item">Maintain silence in the waiting area.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
