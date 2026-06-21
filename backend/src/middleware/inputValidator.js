
const sanitizeString = (str, maxLen = 200) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLen)
    .replace(/[<>{}]/g, ''); // Strip HTML-like chars
};

const VALID_SERVICES = ['hospital', 'college', 'salon', 'hospital-north'];
const VALID_PRIORITIES = ['Normal', 'Senior Citizen', 'VIP', 'Emergency', 'normal', 'senior', 'vip', 'emergency'];
const VALID_TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
];

const validateTokenBooking = (req, res, next) => {
  const { service, name, phone, priority, timeSlot, bookingDate } = req.body;

  const errors = [];

  
  if (!service || typeof service !== 'string') {
    errors.push('Service is required');
  } else if (!VALID_SERVICES.includes(service.toLowerCase())) {
    errors.push(`Invalid service: '${sanitizeString(service, 30)}'`);
  }

  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
  } else {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      errors.push('Invalid phone number format');
    }
  }

  
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Invalid priority: '${sanitizeString(priority, 30)}'`);
  }

  
  if (!timeSlot || !VALID_TIME_SLOTS.includes(timeSlot)) {
    errors.push('Invalid or missing time slot');
  }

  
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    errors.push('Invalid booking date format (expected YYYY-MM-DD)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  
  req.body.service = sanitizeString(service, 50).toLowerCase();
  req.body.name = sanitizeString(name, 100);
  req.body.phone = sanitizeString(phone, 20);
  if (priority) req.body.priority = sanitizeString(priority, 30);

  next();
};

const validateRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    errors.push('Password must be between 6 and 128 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
    });
  }

  req.body.name = sanitizeString(name, 100);
  req.body.email = email.trim().toLowerCase().slice(0, 254);
  req.body.phone = sanitizeString(phone, 20);

  next();
};

module.exports = {
  validateTokenBooking,
  validateRegistration,
  sanitizeString,
};
