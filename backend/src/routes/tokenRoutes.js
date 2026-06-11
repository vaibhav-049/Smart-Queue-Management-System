const express = require('express');
const router = express.Router();
const {
  bookToken,
  getMyTokens,
  getTokenById,
  cancelToken,
  getTokenQR,
} = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookToken);
router.get('/my-tokens', protect, getMyTokens);
router.get('/:id', protect, getTokenById);
router.put('/:id/cancel', protect, cancelToken);
router.get('/:id/qr', protect, getTokenQR);

module.exports = router;
