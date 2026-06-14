import { m } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeCard({ token }) {
  const { darkMode } = useTheme();
  const tokenNumber = token.id || token.displayId;
  const qrValue = `${window.location.origin}/track/${tokenNumber}`;

  return (
    <m.div
      className={`qr-card ${darkMode ? 'dark' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      {/* Ticket Header */}
      <div className="qr-ticket-header">
        <div className="qr-ticket-logo">
          <span className="logo-icon">⚡</span>
          <span>SmartQueue</span>
        </div>
        <span className="qr-ticket-type">E-Token</span>
      </div>

      {/* Perforated edge */}
      <div className="qr-ticket-perforation" />

      {/* Token Info */}
      <div className="qr-ticket-body">
        <div className="qr-token-number">{tokenNumber}</div>
        <div className="qr-ticket-details">
          <div className="qr-detail">
            <span className="qr-label">Name</span>
            <span className="qr-value">{token.name}</span>
          </div>
          <div className="qr-detail">
            <span className="qr-label">Service</span>
            <span className="qr-value capitalize">{token.service}</span>
          </div>
          <div className="qr-detail">
            <span className="qr-label">Position</span>
            <span className="qr-value">#{token.position}</span>
          </div>
          <div className="qr-detail">
            <span className="qr-label">Time Slot</span>
            <span className="qr-value">{token.timeSlot || 'N/A'}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="qr-code-wrapper">
          <QRCodeSVG
            value={qrValue}
            size={160}
            level="H"
            bgColor={darkMode ? '#1e293b' : '#ffffff'}
            fgColor={darkMode ? '#e2e8f0' : '#0f172a'}
            includeMargin
          />
        </div>
        <p className="qr-scan-text">Scan this QR code at the service counter</p>
      </div>

      {/* Ticket Footer */}
      <div className="qr-ticket-footer">
        <span>Valid only on booking date</span>
        <span suppressHydrationWarning>
          {token.bookingDate ? new Date(token.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')}
        </span>
      </div>
    </m.div>
  );
}
