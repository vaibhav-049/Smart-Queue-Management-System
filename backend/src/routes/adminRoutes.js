const express = require('express');
const router = express.Router();
const {
  callNextToken,
  skipToken,
  completeToken,
  closeQueue,
  openQueue,
  getAnalytics,
  verifyScannedToken,
  serveScannedToken,
  generateInviteCode,
  getInviteCodes,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { validateBody, verifyTokenSchema } = require('../middleware/validationMiddleware');

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

// QR verification and specific serve actions
router.post('/verify-token', protect, admin, validateBody(verifyTokenSchema), verifyScannedToken);
router.post('/serve-token', protect, admin, validateBody(verifyTokenSchema), serveScannedToken);

// Invite Codes (Super Admin only - access controlled inside controller)
router.get('/invite-codes', protect, admin, getInviteCodes);
router.post('/invite-codes', protect, admin, generateInviteCode);

module.exports = router;
