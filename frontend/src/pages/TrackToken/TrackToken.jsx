import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import PriorityBadge from '../../components/PriorityBadge/PriorityBadge';
import { FiClock, FiCheckCircle, FiXCircle, FiPlay, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TrackToken() {
  const { darkMode } = useTheme();
  const { tokenId } = useParams();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(true);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let index = 0;
    const fullText = tokenId || '174';
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 150);

    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [tokenId]);


  useEffect(() => {
    const fetchTokenDetails = async () => {
      try {
        const response = await api.get(`/tokens/track/${tokenId}`);
        if (response.data && response.data.success) {
          setTokenData(response.data.data);
        }
      } catch (err) {
        setError('Token not found or invalid.');
        toast.error('Token not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchTokenDetails();
  }, [tokenId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !tokenData) return;

    // Listen to queue updates for the service this token belongs to
    const handleQueueUpdated = (payload) => {
      if (payload.service === tokenData.service) {
        // Trigger a re-fetch of token to get updated position
        api.get(`/tokens/track/${tokenId}`).then(res => {
          if (res.data && res.data.success) {
            setTokenData(res.data.data);
          }
        }).catch(() => {});
      }
    };

    socket.on('queue-updated', handleQueueUpdated);

    // Also try joining the service room to get live updates
    socket.emit('join_service_room', tokenData.service);

    return () => {
      socket.off('queue-updated', handleQueueUpdated);
    };
  }, [tokenData?.service, tokenId]);

  if (showAnimation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-sans select-none">
          {typedText}
          <span className="animate-pulse">|</span>
        </h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`track-token-page ${darkMode ? 'dark' : ''} flex items-center justify-center min-h-screen`}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className={`track-token-page ${darkMode ? 'dark' : ''} flex flex-col items-center justify-center min-h-screen p-4 text-center`}>
        <m.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
          <FiXCircle size={64} className="text-red mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Token</h2>
          <p className="text-muted mb-6">The token you are trying to track does not exist or has been removed.</p>
          <Link to="/" className="btn-primary">Return Home</Link>
        </m.div>
      </div>
    );
  }

  const isServing = tokenData.status === 'serving';
  const isCompleted = tokenData.status === 'completed';
  const isCancelled = tokenData.status === 'cancelled';
  const isWaiting = tokenData.status === 'waiting';

  return (
    <div className={`track-token-page ${darkMode ? 'dark' : ''} min-h-screen py-12 px-4`}>
      <div className="max-w-md mx-auto">
        <m.div
          className="page-header text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Live Token Status</h1>
          <p>Real-time tracking for token <strong>{tokenId}</strong></p>
        </m.div>

        <m.div
          className="qr-card p-6 bg-card rounded-2xl shadow-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Status Banner */}
          <div className={`absolute top-0 left-0 w-full p-2 text-center text-white font-bold tracking-wider uppercase text-sm
            ${isServing ? 'bg-amber-500' : ''}
            ${isWaiting ? 'bg-blue-500' : ''}
            ${isCompleted ? 'bg-green-500' : ''}
            ${isCancelled ? 'bg-red-500' : ''}
          `}>
            {tokenData.status}
          </div>

          <div className="mt-8 text-center border-b border-border pb-6 mb-6">
            <span className="text-sm text-muted uppercase tracking-wider block mb-2">Token Number</span>
            <div className="text-5xl font-black gradient-text tracking-tighter mb-4">{tokenData.displayId}</div>
            <div className="inline-block px-4 py-1 bg-muted/20 rounded-full text-sm capitalize font-medium">
              {tokenData.service} Department
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {isWaiting && (
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between p-4 bg-primary/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <FiMapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Queue Position</p>
                      <p className="font-bold text-xl">#{tokenData.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-muted text-right">Est. Wait</p>
                      <p className="font-bold text-xl text-right">~{tokenData.waitTime}m</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <FiClock size={20} />
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {isServing && (
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 p-4 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400"
              >
                <FiPlay size={24} className="animate-pulse" />
                <div>
                  <p className="font-bold text-lg">It's your turn!</p>
                  <p className="text-sm opacity-80">Please proceed to the service counter immediately.</p>
                </div>
              </m.div>
            )}

            {isCompleted && (
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl text-green-600 dark:text-green-400"
              >
                <FiCheckCircle size={24} />
                <div>
                  <p className="font-bold text-lg">Service Completed</p>
                  <p className="text-sm opacity-80">Thank you for using SmartQueue.</p>
                </div>
              </m.div>
            )}

            <div className="flex justify-between items-center text-sm pt-4 border-t border-border">
              <span className="text-muted">Time Slot</span>
              <span className="font-medium">{tokenData.timeSlot}</span>
            </div>
          </div>
        </m.div>
        
        <div className="text-center mt-8">
          <Link to="/" className="text-primary hover:underline font-medium">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
