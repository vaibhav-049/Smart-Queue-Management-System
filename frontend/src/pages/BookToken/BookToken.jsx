import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useServices } from '../../hooks/useServices';

const timeSlots = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM'
];

const getDateOptions = () => {
  const options = [];
  const labels = ['Today', 'Tomorrow', 'Day After Tomorrow'];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${date}`;
    options.push({
      value: dateStr,
      label: `${labels[i]} (${dateStr})`
    });
  }
  return options;
};

import QRCodeCard from '../../components/QRCodeCard/QRCodeCard';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function BookToken() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  
  const dateOptions = getDateOptions();
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    serviceType: '',
    timeSlot: '',
    priorityType: 'Normal',
    bookingDate: dateOptions[0].value
  });
  const [generatedToken, setGeneratedToken] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const getFilteredTimeSlotsForDate = (dateVal) => {
    const todayStr = dateOptions[0].value;
    if (dateVal !== todayStr) {
      return timeSlots;
    }
    return timeSlots.filter(slot => {
      try {
        const parts = slot.split('-');
        if (parts.length < 2) return false;
        const endTimeStr = parts[1].trim(); // e.g. "10:00 AM"
        
        const match = endTimeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return false;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const now = new Date();
        const slotEnd = new Date();
        slotEnd.setHours(hours, minutes, 0, 0);
        
        return now < slotEnd;
      } catch (e) {
        return false;
      }
    });
  };

  const filteredTimeSlots = getFilteredTimeSlotsForDate(form.bookingDate);

  const handleBookingDateChange = (dateVal) => {
    setForm(prev => {
      const validSlots = getFilteredTimeSlotsForDate(dateVal);
      const updatedSlot = validSlots.includes(prev.timeSlot) ? prev.timeSlot : '';
      return {
        ...prev,
        bookingDate: dateVal,
        timeSlot: updatedSlot
      };
    });
  };

  // Auto-populate fields when user context is available
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setForm({ ...form, serviceType: service.id });
    setGeneratedToken(null);
    setShowQR(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a service first');
      return;
    }
    if (!form.name || !form.phone || !form.timeSlot || !form.bookingDate) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const response = await api.post('/tokens/book', {
        service: selectedService.id,
        timeSlot: form.timeSlot,
        priorityType: form.priorityType || 'Normal',
        bookingDate: form.bookingDate,
        name: form.name,
        phone: form.phone,
      });

      if (response.data && response.data.success) {
        const bookedToken = response.data.data;
        setGeneratedToken(bookedToken);
        toast.success(`Token ${bookedToken.displayId} generated successfully!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to book token. Please try again.';
      toast.error(errMsg);
    }
  };

  return (
    <div className={`book-token-page ${darkMode ? 'dark' : ''}`}>
      <m.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Book a Token</h1>
        <p>Select a service and fill in your details to get a queue token</p>
      </m.div>

      {/* Service Selection */}
      <div className="service-selection">
        <h2 className="section-label">Select Service</h2>
        <div className="service-grid">
          {servicesLoading ? (
            <p>Loading services...</p>
          ) : (
            services.map((service, index) => (
              <m.div
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
                  <m.div
                    className="service-check"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ background: service.color }}
                  >
                    ✓
                  </m.div>
                )}
              </m.div>
            ))
          )}
        </div>
      </div>

      {/* Booking Form + Generated Token */}
      <div className="booking-layout">
        <AnimatePresence mode="wait">
          {selectedService && (
            <m.div
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
                  <label htmlFor="bt-date">Booking Date</label>
                  <select
                    id="bt-date"
                    value={form.bookingDate}
                    onChange={e => handleBookingDateChange(e.target.value)}
                    required
                  >
                    {dateOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bt-slot">Preferred Time Slot</label>
                  <select
                    id="bt-slot"
                    value={form.timeSlot}
                    onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                    required
                    disabled={filteredTimeSlots.length === 0}
                  >
                    {filteredTimeSlots.length === 0 ? (
                      <option value="">No slots available for today</option>
                    ) : (
                      <>
                        <option value="">Select a time slot</option>
                        {filteredTimeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {filteredTimeSlots.length === 0 && (
                    <span className="form-help-error" style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                      ⚠️ All standard work slots for today have passed. Please select Tomorrow or Day After Tomorrow.
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="bt-priority">Priority Category</label>
                  <select
                    id="bt-priority"
                    value={form.priorityType}
                    onChange={e => setForm({ ...form, priorityType: e.target.value })}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Senior Citizen">Senior Citizen (60+)</option>
                    <option value="VIP">VIP</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <m.button
                  type="submit"
                  className="btn-primary-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: selectedService.color }}
                >
                  🎫 Generate Token
                </m.button>
              </form>
            </m.div>
          )}
        </AnimatePresence>
 
        {/* Generated Token */}
        <AnimatePresence>
          {generatedToken && (
            <m.div
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
                  <div className="generated-token-number">{generatedToken.displayId || generatedToken.id}</div>
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
                      <span className="gt-label">Booking Date</span>
                      <span className="gt-value">{generatedToken.bookingDate}</span>
                    </div>
                    <div className="gt-detail">
                      <span className="gt-label">Time Slot</span>
                      <span className="gt-value">{generatedToken.timeSlot}</span>
                    </div>
                  </div>
                  <m.button
                    type="button"
                    className="btn-outline"
                    onClick={() => setShowQR(!showQR)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {showQR ? 'Hide QR Code' : 'View QR Code'}
                  </m.button>
                </div>
              </div>

              <AnimatePresence>
                {showQR && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <QRCodeCard token={generatedToken} />
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
