const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');


const ipUserKeyGenerator = (req) => {
  
  if (req.user && (req.user._id || req.user.id)) {
    return `user_${req.user._id || req.user.id}`;
  }

  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        return `user_${decoded.id}`;
      }
    } catch (error) {
      
    }
  }

  
  return `ip_${req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress}`;
};


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  keyGenerator: ipUserKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  keyGenerator: ipUserKeyGenerator,
  message: {
    success: false,
    message: 'Too many registration or login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});


const publicTrackerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 60, 
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
