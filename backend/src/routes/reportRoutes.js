const express = require('express');
const router = express.Router();
const {
  downloadReport,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/download', protect, admin, downloadReport);
router.get('/daily', protect, admin, getDailyReport);
router.get('/weekly', protect, admin, getWeeklyReport);
router.get('/monthly', protect, admin, getMonthlyReport);

module.exports = router;
