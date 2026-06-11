import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { services, timeSlots } from '../../services/mockData';
import QRCodeCard from '../../components/QRCodeCard/QRCodeCard';
import toast from 'react-hot-toast';

export default function BookToken() {
  const { darkMode } = useTheme();
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', serviceType: '', timeSlot: '' });
  const [generatedToken, setGeneratedToken] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setForm({ ...form, serviceType: service.id });
    setGeneratedToken(null);
    setShowQR(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a service first');
      return;
    }
    if (!form.name || !form.phone || !form.timeSlot) {
      toast.error('Please fill all fields');
      return;
    }

    const prefix = selectedService.id.charAt(0).toUpperCase();
    const num = Math.floor(Math.random() * 900) + 100;
    const token = {
      id: `${prefix}${num}`,
      name: form.name,
      phone: form.phone,
      service: selectedService.name,
      position: Math.floor(Math.random() * 20) + 1,
      waitTime: Math.floor(Math.random() * 30) + 5,
      timeSlot: form.timeSlot,
      priority: 'normal',
      status: 'waiting',
    };

    setGeneratedToken(token);
    toast.success(`Token ${token.id} generated successfully!`);
  };

  return (
    <div className={`book-token-page ${darkMode ? 'dark' : ''}`}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Book a Token</h1>
        <p>Select a service and fill in your details to get a queue token</p>
      </motion.div>

      {/* Service Selection */}
      <div className="service-selection">
        <h2 className="section-label">Select Service</h2>
        <div className="service-grid">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
              onClick={() => handleServiceSelect(service)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              style={{ '--service-color': service.color }}
            >
              <div className="service-card-icon" style={{ background: `${service.color}15`, color: service.color }}>
                <span style={{ fontSize: '2rem' }}>{service.icon}</span>
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              {selectedService?.id === service.id && (
                <motion.div
                  className="service-check"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ background: service.color }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Booking Form + Generated Token */}
      <div className="booking-layout">
        <AnimatePresence mode="wait">
          {selectedService && (
            <motion.div
              className="booking-form-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="section-label">
                <span style={{ color: selectedService.color }}>{selectedService.icon}</span> {selectedService.name} — Booking Details
              </h2>
              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="bt-name">Full Name</label>
                  <input
                    id="bt-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bt-phone">Mobile Number</label>
                  <input
                    id="bt-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bt-service">Service Type</label>
                  <input
                    id="bt-service"
                    type="text"
                    value={selectedService.name}
                    readOnly
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bt-slot">Preferred Time Slot</label>
                  <select
                    id="bt-slot"
                    value={form.timeSlot}
                    onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                    required
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <motion.button
                  type="submit"
                  className="btn-primary-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: selectedService.color }}
                >
                  🎫 Generate Token
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Token */}
        <AnimatePresence>
          {generatedToken && (
            <motion.div
              className="generated-token-section"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="generated-token-card">
                <div className="generated-token-header">
                  <span>🎉 Token Generated!</span>
                </div>
                <div className="generated-token-body">
                  <div className="generated-token-number">{generatedToken.id}</div>
                  <div className="generated-token-details">
                    <div className="gt-detail">
                      <span className="gt-label">Queue Position</span>
                      <span className="gt-value">#{generatedToken.position}</span>
                    </div>
                    <div className="gt-detail">
                      <span className="gt-label">Estimated Wait</span>
                      <span className="gt-value">{generatedToken.waitTime} min</span>
                    </div>
                    <div className="gt-detail">
                      <span className="gt-label">Time Slot</span>
                      <span className="gt-value">{generatedToken.timeSlot}</span>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    className="btn-outline"
                    onClick={() => setShowQR(!showQR)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {showQR ? 'Hide QR Code' : 'View QR Code'}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <QRCodeCard token={generatedToken} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
