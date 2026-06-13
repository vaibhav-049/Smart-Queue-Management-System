const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Key generator that identifies requests by User ID (if authenticated) or IP address
const ipUserKeyGenerator = (req) => {
  // 1. If authMiddleware has already run, use user ID
  if (req.user && (req.user._id || req.user.id)) {
    return `user_${req.user._id || req.user.id}`;
  }

  // 2. Parse and verify authorization token manually if authMiddleware has not run yet
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_smart_queue_system_2026_safe');
      if (decoded && decoded.id) {
        return `user_${decoded.id}`;
      }
    } catch (error) {
      // Token expired, invalid, or signature verification failed: fallback to IP
    }
  }

  // 3. Fallback to client IP
  return `ip_${req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress}`;
};

// General rate limiter for all standard API calls
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each client to 200 requests per 15 minutes
  keyGenerator: ipUserKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Stricter rate limiter for sensitive authentication & OTP endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each client to 15 login/OTP attempts per 15 minutes
  keyGenerator: ipUserKeyGenerator,
  message: {
    success: false,
    message: 'Too many registration or login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Rate limiter for public queue status or tracking screens
const publicTrackerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each client to 60 requests per minute
  keyGenerator: ipUserKeyGenerator,
  message: {
    success: false,
    message: 'Too many status tracking requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  publicTrackerLimiter,
};
