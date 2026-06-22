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
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
           fetchQueueStatus(); 
        }
      });
      
      socket.on('queue-updated', (data) => {
        if (data && data.service === service) {
           fetchQueueStatus(); 
        }
      });
    }

    
    const interval = setInterval(fetchQueueStatus, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('queue_updated');
        socket.off('queue-updated');
        socket.emit('leave_service_room', service);
      }
    };
    
  }, [service]);

  
  useEffect(() => {
    const currentTokenId = typeof queueData.currentServing === 'string' ? queueData.currentServing : queueData.currentServing?.displayId;
    
    if (currentTokenId && currentTokenId !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = currentTokenId;
      
      
      if ('speechSynthesis' in window) {
        
        window.speechSynthesis.cancel();

        
        const message = new SpeechSynthesisUtterance(
          `Token number ${currentTokenId}. Please proceed to the counter.`
        );
        message.rate = 0.9; 
        message.pitch = 1;
        
        
        setTimeout(() => {
          window.speechSynthesis.speak(message);
        }, 500);
      }
    }
  }, [queueData.currentServing]);

  if (isMobile) {
    return (
      <div className="tv-loading" style={{ background: '#111827', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Access Restricted</h2>
        <p style={{ color: '#9CA3AF', fontSize: '1.2rem', maxWidth: '400px', lineHeight: '1.5' }}>
          The TV Display interface is designed only for large screens (Laptops, Tablets, or Smart TVs). 
          Please open this link on a larger display to view the queue.
        </p>
      </div>
    );
  }

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
      {}
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

      {}
      <main className="tv-main">
        {}
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

        {}
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

      {}
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
