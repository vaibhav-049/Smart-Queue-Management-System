const Queue = require('../models/Queue');
const Service = require('../models/Service');
const Token = require('../models/Token');

/**
 * @desc    Get live status of all service queues
 * @route   GET /api/queues/status
 * @access  Public
 */
const getQueuesStatus = async (req, res, next) => {
  try {
    const queues = await Queue.find({});
    const services = await Service.find({});

    // Mapped response matching the frontend's expected mockData structure
    const statusMap = {};

    for (const service of services) {
      const queueDoc = queues.find(q => q.service === service.id);
      
      statusMap[service.id] = {
        currentServing: queueDoc ? queueDoc.currentServing : null,
        upcoming: queueDoc ? queueDoc.upcoming : [],
        totalInQueue: queueDoc ? queueDoc.totalInQueue : 0,
        avgWait: queueDoc ? queueDoc.avgWait : service.avgServiceTime,
        isActive: queueDoc ? queueDoc.isActive : true,
        serviceName: service.name,
        icon: service.icon,
        color: service.color,
      };
    }

    res.status(200).json({
      success: true,
      data: statusMap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed queue status for a specific service
 * @route   GET /api/queues/:service/status
 * @access  Public
 */
const getServiceQueueStatus = async (req, res, next) => {
  try {
    const { service } = req.params;

    const serviceInfo = await Service.findOne({ id: service });
    if (!serviceInfo) {
      res.status(404);
      throw new Error(`Service '${service}' not found`);
    }

    const queueDoc = await Queue.findOne({ service });
    
    // Fetch detailed tokens currently active (serving or waiting) for lobby displays
    const activeTokens = await Token.find({
      service,
      status: { $in: ['serving', 'waiting'] },
    }).sort({ status: -1, waitTime: 1, createdAt: 1 }); // serving first, then by wait time/createdAt

    res.status(200).json({
      success: true,
      data: {
        service: serviceInfo,
        currentServing: queueDoc ? queueDoc.currentServing : null,
        upcoming: queueDoc ? queueDoc.upcoming : [],
        totalInQueue: queueDoc ? queueDoc.totalInQueue : 0,
        avgWait: queueDoc ? queueDoc.avgWait : serviceInfo.avgServiceTime,
        isActive: queueDoc ? queueDoc.isActive : true,
        activeTokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live tracking for a specific service
 * @route   GET /api/queue/live
 * @access  Public
 */
const getLiveQueue = async (req, res, next) => {
  try {
    const serviceName = req.query.service || 'Hospital';
    const serviceSlug = serviceName.toLowerCase();

    const queueDoc = await Queue.findOne({ service: serviceSlug });
    
    const currentlyServing = queueDoc ? (queueDoc.currentServing || '') : '';
    const nextTokens = queueDoc ? queueDoc.upcoming : [];

    res.status(200).json({
      currentlyServing,
      nextTokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public aggregate stats for the landing page
 * @route   GET /api/queues/public-stats
 * @access  Public
 */
const getPublicStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const tokensServedToday = await Token.countDocuments({
      status: 'completed',
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const activeUserIds = await Token.distinct('userId', {
      status: { $in: ['waiting', 'serving'] },
    });
    const activeUsers = activeUserIds.length;

    res.status(200).json({
      success: true,
      data: {
        tokensServedToday,
        activeUsers,
        waitTimeReduced: 40,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueuesStatus,
  getServiceQueueStatus,
  getLiveQueue,
  getPublicStats,
};
