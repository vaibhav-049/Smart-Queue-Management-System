const express = require('express');
const router = express.Router();
const {
  callNextToken,
  skipToken,
  completeToken,
  closeQueue,
  openQueue,
  getAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Traditional REST endpoints
router.post('/queues/:service/next', protect, admin, callNextToken);
router.post('/queues/:service/skip/:tokenId', protect, admin, skipToken);
router.post('/queues/:service/close', protect, admin, closeQueue);
router.post('/queues/:service/open', protect, admin, openQueue);

// New flat action-based endpoints from specifications
router.post('/call-next', protect, admin, callNextToken);
router.post('/skip-token', protect, admin, skipToken);
router.post('/complete-token', protect, admin, completeToken);
router.post('/close-queue', protect, admin, closeQueue);
router.post('/open-queue', protect, admin, openQueue);

router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
