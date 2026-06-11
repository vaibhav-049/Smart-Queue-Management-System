const express = require('express');
const router = express.Router();
const { getQueuesStatus, getServiceQueueStatus, getLiveQueue, getPublicStats } = require('../controllers/queueController');

router.get('/status', getQueuesStatus);
router.get('/live', getLiveQueue);
router.get('/public-stats', getPublicStats);
router.get('/:service/status', getServiceQueueStatus);

module.exports = router;
