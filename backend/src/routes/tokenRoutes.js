const express = require('express');
const router = express.Router();
const {
  bookToken,
  getMyTokens,
  getTokenById,
  cancelToken,
  getTokenQR,
  rateToken,
} = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');

const { publicTrackerLimiter } = require('../middleware/rateLimitMiddleware');
const { validateBody, bookTokenSchema } = require('../middleware/validationMiddleware');

router.post('/book', protect, validateBody(bookTokenSchema), bookToken);
router.get('/my-tokens', protect, getMyTokens);
router.get('/:id', protect, getTokenById);
router.put('/:id/cancel', protect, cancelToken);
router.get('/:id/qr', protect, getTokenQR);
router.put('/:id/rate', protect, rateToken);

// Public route for QR code scanning with strict rate limiting
router.get('/track/:displayId', publicTrackerLimiter, require('../controllers/tokenController').trackToken);

module.exports = router;
