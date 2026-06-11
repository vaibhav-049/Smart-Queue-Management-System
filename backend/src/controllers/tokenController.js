const Token = require('../models/Token');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const { generateTokenId } = require('../services/tokenGenerator');
const { calculateEstimate } = require('../services/waitingTimeCalculator');
const { generateQR } = require('../services/qrGenerator');
const { recalculateQueue } = require('../services/queueManager');

// Helper to calculate position dynamically based on the Queue document
const getDynamicPosition = async (token) => {
  if (token.status === 'serving') return 0;
  if (token.status !== 'waiting') return -1;

  const queue = await Queue.findOne({ service: token.service });
  if (!queue) return -1;

  if (queue.currentServing === token.displayId) return 0;
  const index = queue.upcoming.indexOf(token.displayId);
  return index !== -1 ? index + 1 : -1;
};

/**
 * @desc    Book a new token
 * @route   POST /api/tokens/book
 * @access  Private
 */
const mapIncomingPriority = (priorityType) => {
  const mapping = {
    'Emergency': 'emergency',
    'Senior Citizen': 'senior',
    'VIP': 'vip',
    'Normal': 'normal',
  };
  return mapping[priorityType] || (priorityType ? priorityType.toLowerCase() : 'normal');
};

/**
 * @desc    Book a new token
 * @route   POST /api/tokens/book
 * @access  Private
 */
const bookToken = async (req, res, next) => {
  try {
    const { service, priorityType, priority: priorityField } = req.body;
    let { timeSlot } = req.body;

    // Accept both 'priority' and 'priorityType' from frontend
    const incomingPriority = priorityType || priorityField || 'Normal';

    if (!service) {
      res.status(400);
      throw new Error('Please provide a service');
    }

    if (!timeSlot) {
      timeSlot = '09:00 AM - 10:00 AM';
    }

    const serviceSlug = service.toLowerCase();

    // 1. Verify if the service exists
    const serviceInfo = await Service.findOne({ id: serviceSlug });
    if (!serviceInfo) {
      res.status(404);
      throw new Error(`Service '${service}' not found`);
    }

    // 2. Check if the service queue is active
    const queueInfo = await Queue.findOne({ service: serviceSlug });
    if (queueInfo && !queueInfo.isActive) {
      res.status(400);
      throw new Error('Queue for this service is currently closed');
    }

    // 3. Generate sequential display ID (resets daily)
    const { displayId, sequenceNumber } = await generateTokenId(serviceSlug, serviceInfo.prefix);

    // 4. Calculate initial estimate
    const priorityTier = mapIncomingPriority(incomingPriority);
    const { position, waitTime } = await calculateEstimate(serviceSlug, incomingPriority);

    // 5. Create token
    const token = new Token({
      displayId,
      userId: req.user._id,
      service: serviceSlug,
      status: 'waiting',
      priority: priorityTier,
      timeSlot,
      sequenceNumber,
      waitTime,
      name: req.user.name,
      phone: req.user.phone,
    });

    // 6. Generate QR code
    token.qrCodeUrl = await generateQR(token, position);
    await token.save();

    // 7. Recalculate queue sorting and notify clients
    await recalculateQueue(serviceSlug);

    // Reload token to get updated values
    const updatedToken = await Token.findById(token._id);
    const finalPosition = await getDynamicPosition(updatedToken);
    
    // Waiting Time = People Ahead * Average Service Time
    const peopleAhead = Math.max(0, finalPosition - 1);
    const finalWaitTime = peopleAhead * (serviceInfo.avgServiceTime || 10);

    const { emitTokenCreated } = require('../config/socket');
    emitTokenCreated({
      tokenNumber: updatedToken.displayId,
      position: finalPosition,
      estimatedWaitTime: `${finalWaitTime} minutes`,
    });

    res.status(201).json({
      success: true,
      data: {
        ...updatedToken.toObject(),
        position: finalPosition,
        waitTime: finalWaitTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's tokens
 * @route   GET /api/tokens/my-tokens
 * @access  Private
 */
const getMyTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const tokensWithPositions = await Promise.all(
      tokens.map(async (token) => {
        const position = await getDynamicPosition(token);
        return {
          ...token.toObject(),
          position,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: tokensWithPositions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get token details by ID
 * @route   GET /api/tokens/:id
 * @access  Private
 */
const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    // Users can only view their own token unless they are an admin
    if (token.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this token');
    }

    const position = await getDynamicPosition(token);

    res.status(200).json({
      success: true,
      data: {
        ...token.toObject(),
        position,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a token
 * @route   PUT /api/tokens/:id/cancel
 * @access  Private
 */
const cancelToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    // Confirm authorization
    if (token.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to cancel this token');
    }

    if (token.status === 'completed' || token.status === 'cancelled') {
      res.status(400);
      throw new Error(`Token is already ${token.status}`);
    }

    token.status = 'cancelled';
    token.waitTime = 0;
    await token.save();

    // Re-adjust queue positions & notify rooms
    await recalculateQueue(token.service);

    res.status(200).json({
      success: true,
      message: 'Token cancelled successfully',
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get QR code of token
 * @route   GET /api/tokens/:id/qr
 * @access  Private
 */
const getTokenQR = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id).select('qrCodeUrl displayId userId');

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    if (token.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this token QR');
    }

    res.status(200).json({
      success: true,
      data: {
        displayId: token.displayId,
        qrCodeUrl: token.qrCodeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public token tracking details by display ID
 * @route   GET /api/tokens/track/:displayId
 * @access  Public
 */
const trackToken = async (req, res, next) => {
  try {
    const { displayId } = req.params;
    const token = await Token.findOne({ displayId });

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    const position = await getDynamicPosition(token);

    res.status(200).json({
      success: true,
      data: {
        displayId: token.displayId,
        service: token.service,
        status: token.status,
        position,
        waitTime: token.waitTime,
        timeSlot: token.timeSlot,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookToken,
  getMyTokens,
  getTokenById,
  cancelToken,
  getTokenQR,
  trackToken,
};
