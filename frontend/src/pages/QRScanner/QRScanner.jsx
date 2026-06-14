import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function QRScanner() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  
  const [manualId, setManualId] = useState('');
  const [tokenDetails, setTokenDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Initialize Html5Qrcode instance on mount
  useEffect(() => {
    const scanner = new Html5Qrcode('scanner-view');
    setScannerInstance(scanner);

    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        } else {
          setCameraError('No cameras found. Please use manual verification below.');
          toast.error('No cameras found.');
        }
      })
      .catch(err => {
        console.error('Error getting cameras:', err);
        const isNotSecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isNotSecure) {
          setCameraError('Browser blocked camera because the connection is insecure (HTTP). Browsers only allow camera usage on HTTPS or localhost. Please use the manual search below.');
        } else {
          setCameraError('Failed to access camera: ' + err.message);
        }
      });

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(e => console.error('Error stopping scanner on unmount', e));
      }
    };
  }, []);

  const startScanning = async (cameraId) => {
    if (!scannerInstance) return;
    try {
      setError(null);
      setTokenDetails(null);
      setIsScanning(true);
      await scannerInstance.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        () => {
          // Frame match failure - silent
        }
      );
    } catch (err) {
      console.error('Failed to start scanning:', err);
      toast.error('Could not initialize camera stream.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerInstance && scannerInstance.isScanning) {
      try {
        await scannerInstance.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };

  const handleQRCodeScanned = async (text) => {
    await stopScanning();

    // Parse displayId from scanned URL
    // e.g. "http://localhost:5173/track/H003" or just "H003"
    let displayId = text.trim();
    if (text.includes('/track/')) {
      const parts = text.split('/track/');
      if (parts.length > 1) {
        displayId = parts[1].split(/[?#]/)[0].trim();
      }
    }

    if (!/^[A-Z]\d{3}$/.test(displayId)) {
      setError('Invalid QR Code format. Could not retrieve a valid Token Display ID.');
      return;
    }

    // Restricted staff check
    const servicePrefixes = { hospital: 'H', college: 'C', salon: 'S' };
    if (user?.service) {
      const expectedPrefix = servicePrefixes[user.service.toLowerCase()];
      if (expectedPrefix && !displayId.startsWith(expectedPrefix)) {
        setError(`Unauthorized: You are registered to the ${user.service} service and can only verify tokens starting with '${expectedPrefix}'.`);
        toast.error(`Cannot scan token for other departments.`);
        return;
      }
    }

    await verifyToken(displayId);
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    const formattedId = manualId.trim().toUpperCase();
    if (!/^[A-Z]\d{3}$/.test(formattedId)) {
      toast.error('Please enter a valid Display ID (e.g. H001)');
      return;
    }

    // Restricted staff check
    const servicePrefixes = { hospital: 'H', college: 'C', salon: 'S' };
    if (user?.service) {
      const expectedPrefix = servicePrefixes[user.service.toLowerCase()];
      if (expectedPrefix && !formattedId.startsWith(expectedPrefix)) {
        setError(`Unauthorized: You are registered to the ${user.service} service and can only verify tokens starting with '${expectedPrefix}'.`);
        toast.error(`Cannot search token for other departments.`);
        return;
      }
    }

    await stopScanning();
    await verifyToken(formattedId);
  };

  const verifyToken = async (displayId) => {
    setIsLoading(true);
    setError(null);
    setTokenDetails(null);
    try {
      const response = await api.post('/admin/verify-token', { displayId });
      if (response.data && response.data.success) {
        setTokenDetails(response.data.data);
        toast.success(`Token ${displayId} verified successfully!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || `Failed to verify token ${displayId}.`;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServe = async () => {
    if (!tokenDetails) return;
    setIsLoading(true);
    try {
      const response = await api.post('/admin/serve-token', { displayId: tokenDetails.displayId });
      if (response.data && response.data.success) {
        toast.success(`Token ${tokenDetails.displayId} is now serving at the counter.`);
        setTokenDetails(response.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to serve token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!tokenDetails) return;
    setIsLoading(true);
    try {
      const response = await api.post('/admin/complete-token', {
        service: tokenDetails.service,
        tokenNumber: tokenDetails.displayId
      });
      if (response.data && response.data.success) {
        toast.success(`Token ${tokenDetails.displayId} marked as completed.`);
        setTokenDetails(response.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!tokenDetails) return;
    setIsLoading(true);
    try {
      const response = await api.post('/admin/skip-token', {
        service: tokenDetails.service,
        tokenNumber: tokenDetails.displayId
      });
      if (response.data && response.data.success) {
        toast.success(`Token ${tokenDetails.displayId} skipped and status set to cancelled.`);
        setTokenDetails(response.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to skip token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanNext = () => {
    setTokenDetails(null);
    setError(null);
    setManualId('');
    if (selectedCameraId) {
      startScanning(selectedCameraId);
    }
  };

  const getServiceColor = (service) => {
    const colors = { hospital: '#EF4444', college: '#8B5CF6', salon: '#EC4899' };
    return colors[service.toLowerCase()] || '#10B981';
  };

  return (
    <div className={`scanner-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>📷 Token Verification Scanner</h1>
        <p>Scan visitor QR codes or search display IDs to verify credentials and admit them physically</p>
      </m.div>

      <div className="scanner-layout">
        <div className="scanner-camera-section">
          {/* Camera Controls */}
          {cameras.length > 0 && (
            <div className="camera-selector-panel">
              <label htmlFor="camera-select">Choose Camera</label>
              <div className="camera-selector-row">
                <select
                  id="camera-select"
                  value={selectedCameraId}
                  onChange={e => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) {
                      stopScanning().then(() => startScanning(e.target.value));
                    }
                  }}
                  disabled={isScanning}
                >
                  {cameras.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.label || `Camera ${cameras.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>

                {!isScanning ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => startScanning(selectedCameraId)}
                  >
                    Start Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={stopScanning}
                  >
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Webcam Viewport */}
          <div className="scanner-viewport-wrapper">
            {cameraError ? (
              <div className="scanner-placeholder camera-error-view" style={{
                padding: '1.5rem',
                textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px'
              }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</span>
                <h4 style={{ marginBottom: '0.5rem', color: '#EF4444' }}>Camera Access Blocked</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1.25rem', maxWidth: '320px' }}>
                  {cameraError}
                </p>
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <div style={{
                    fontSize: '0.75rem',
                    background: 'var(--primary-bg)',
                    color: 'var(--primary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}>
                    <strong>Tip:</strong> If testing on your phone's Chrome browser, go to <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>, add <code>{window.location.origin}</code>, enable the flag, and relaunch Chrome.
                  </div>
                )}
              </div>
            ) : (
              <>
                <div id="scanner-view" className={isScanning ? 'active-scanner' : 'inactive-scanner'}></div>
                {!isScanning && !tokenDetails && !error && (
                  <div className="scanner-placeholder">
                    <span style={{ fontSize: '3rem' }}>📷</span>
                    <p>Click "Start Camera" or use the manual search below</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="scanner-manual-panel">
            <h3>Manual Display ID Search</h3>
            <form onSubmit={handleManualSearch} className="scanner-manual-form">
              <input
                type="text"
                placeholder="Enter Token Number (e.g. H005)"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                maxLength={4}
                required
              />
              <button type="submit" className="btn-secondary" disabled={isLoading}>
                Verify
              </button>
            </form>
          </div>
        </div>

        {/* Verification & Details Display Panel */}
        <div className="scanner-results-section">
          <AnimatePresence mode="wait">
            {isLoading && (
              <m.div
                key="loading"
                className="scanner-message-card loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="spinner"></div>
                <p>Retrieving and verifying token credentials...</p>
              </m.div>
            )}

            {!isLoading && error && (
              <m.div
                key="error"
                className="scanner-message-card error-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="alert-icon">❌</div>
                <h2>Invalid or Expired Token</h2>
                <p>{error}</p>
                <button type="button" className="btn-primary" onClick={handleScanNext}>
                  Scan Next Token
                </button>
              </m.div>
            )}

            {!isLoading && tokenDetails && (
              <m.div
                key="details"
                className="scanner-details-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ '--accent-color': getServiceColor(tokenDetails.service) }}
              >
                <div className="details-header" style={{ background: getServiceColor(tokenDetails.service) }}>
                  <span className="details-header-badge">VERIFIED</span>
                  <h2 className="details-header-id">{tokenDetails.displayId}</h2>
                  <p className="details-header-service">{tokenDetails.service.toUpperCase()}</p>
                </div>

                <div className="details-body">
                  <h3 className="details-section-title">Physical Matching Details</h3>
                  <div className="details-grid">
                    <div className="details-row">
                      <span className="details-label">Visitor Name</span>
                      <span className="details-value highlight">{tokenDetails.name}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label">Mobile Number</span>
                      <span className="details-value">{tokenDetails.phone}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label">Booking Date</span>
                      <span className="details-value">{tokenDetails.bookingDate}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label">Preferred Time Slot</span>
                      <span className="details-value">{tokenDetails.timeSlot}</span>
                    </div>
                    <div className="details-row">
                      <span className="details-label">Priority Tier</span>
                      <span className="details-value" style={{ textTransform: 'capitalize', fontWeight: '600', color: tokenDetails.priority === 'normal' ? 'inherit' : '#F59E0B' }}>
                        {tokenDetails.priority}
                      </span>
                    </div>
                    <div className="details-row">
                      <span className="details-label">Current Status</span>
                      <span className={`status-badge ${tokenDetails.status}`}>
                        {tokenDetails.status}
                      </span>
                    </div>
                  </div>

                  <div className="details-actions">
                    {tokenDetails.status === 'waiting' && (
                      <button
                        type="button"
                        className="btn-success-full"
                        onClick={handleServe}
                      >
                        ⚡ Serve / Admit Now
                      </button>
                    )}
                    
                    {tokenDetails.status === 'serving' && (
                      <button
                        type="button"
                        className="btn-primary-full"
                        onClick={handleComplete}
                        style={{ background: getServiceColor(tokenDetails.service) }}
                      >
                        ✓ Mark Completed
                      </button>
                    )}

                    {(tokenDetails.status === 'waiting' || tokenDetails.status === 'serving') && (
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={handleSkip}
                      >
                        ✕ Skip / Cancel Token
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-outline-full"
                      onClick={handleScanNext}
                    >
                      📷 Scan Next Token
                    </button>
                  </div>
                </div>
              </m.div>
            )}

            {!isLoading && !tokenDetails && !error && (
              <m.div
                key="idle"
                className="scanner-message-card idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="idle-icon">⚡</div>
                <h2>Awaiting Scan...</h2>
                <p>Please scan a QR code from a visitor's token card or enter their display ID manually to begin physical verification.</p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
