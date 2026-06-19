const Token = require('../models/Token');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const { generateTokenId } = require('../services/tokenGenerator');
const { calculateEstimate } = require('../services/waitingTimeCalculator');
const { generateQR } = require('../services/qrGenerator');
const { recalculateQueue } = require('../services/queueManager');
const { predictAvgServiceTime } = require('../services/waitingTimePredictor');
const { getLocalDateString, isTimeSlotPast } = require('../utils/dateUtils');

// Helper to calculate position dynamically based on the Queue document
const getDynamicPosition = async (token) => {
  if (token.status === 'serving') return 0;
  if (token.status !== 'waiting') return -1;

  const todayStr = getLocalDateString();
  if (token.bookingDate === todayStr) {
    const queue = await Queue.findOne({ service: token.service });
    if (!queue) return -1;

    if (queue.currentServing === token.displayId) return 0;
    const index = queue.upcoming.indexOf(token.displayId);
    return index !== -1 ? index + 1 : -1;
  } else {
    // For future dates, calculate position among all waiting tokens for that date
    const waitingTokens = await Token.find({
      service: token.service,
      bookingDate: token.bookingDate,
      status: 'waiting'
    });

    const PRIORITY_RANKS = {
      'Emergency': 4,
      'Senior Citizen': 3,
      'VIP': 2,
      'Normal': 1,
      emergency: 4,
      'senior citizen': 3,
      senior: 3,
      vip: 2,
      normal: 1,
    };

    waitingTokens.sort((a, b) => {
      const rankA = PRIORITY_RANKS[a.priority] || 1;
      const rankB = PRIORITY_RANKS[b.priority] || 1;

      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const index = waitingTokens.findIndex(t => t.displayId === token.displayId);
    return index !== -1 ? index + 1 : -1;
  }
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
    const { service, priorityType, priority: priorityField, bookingDate, name, phone } = req.body;
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

    if (!bookingDate) {
      res.status(400);
      throw new Error('Please provide a booking date');
    }

    const todayStr = getLocalDateString();
    const today = new Date(todayStr);
    const bookDate = new Date(bookingDate);

    if (isNaN(bookDate.getTime())) {
      res.status(400);
      throw new Error('Invalid booking date format');
    }

    // Reset hours to compare dates only
    today.setHours(0,0,0,0);
    bookDate.setHours(0,0,0,0);

    if (bookDate < today) {
      res.status(400);
      throw new Error('Cannot book tokens for past dates');
    }

    if (bookingDate === todayStr && isTimeSlotPast(bookingDate, timeSlot)) {
      res.status(400);
      throw new Error('Preferred time slot has already passed for today');
    }

    const maxFutureDate = new Date(today);
    maxFutureDate.setDate(today.getDate() + 2); // 3 days window: today, today+1, today+2

    if (bookDate > maxFutureDate) {
      res.status(400);
      throw new Error('Booking is only allowed up to 3 days in advance (today, tomorrow, and day after)');
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

    let priorityTier = mapIncomingPriority(incomingPriority);
    
    // Auto-assign VIP if user has an active VIP membership
    if (req.user.isVip && req.user.vipValidTill && new Date(req.user.vipValidTill) > new Date()) {
      priorityTier = 'vip';
    }

    // 2.5 Apply Limits for VIP and Senior Citizen
    if (['vip', 'senior'].includes(priorityTier)) {
      // Exclude cancelled tokens from the count
      const dailySpecialCount = await Token.countDocuments({
        service: serviceSlug,
        bookingDate,
        priority: { $in: ['vip', 'senior'] },
        status: { $ne: 'cancelled' }
      });

      if (dailySpecialCount >= 5) {
        res.status(400);
        throw new Error('Daily limit of 5 VIP/Senior Citizen bookings has been reached. Please book as Normal or select another date.');
      }

      const slotSpecialCount = await Token.countDocuments({
        service: serviceSlug,
        bookingDate,
        timeSlot,
        priority: { $in: ['vip', 'senior'] },
        status: { $ne: 'cancelled' }
      });

      if (slotSpecialCount >= 2) {
        res.status(400);
        throw new Error('Time slot limit of 2 VIP/Senior Citizen bookings reached. Please choose a different time slot.');
      }
    }

    // 3. Generate sequential display ID (resets daily per bookingDate)
    const { displayId, sequenceNumber } = await generateTokenId(serviceSlug, serviceInfo.prefix, bookingDate);

    // 4. Calculate initial estimate

    const { position, waitTime } = await calculateEstimate(serviceSlug, incomingPriority, bookingDate);

    // 5. Create token
    const token = new Token({
      displayId,
      userId: req.user._id,
      service: serviceSlug,
      branchId: serviceInfo.branchId,
      status: 'waiting',
      priority: priorityTier,
      timeSlot,
      bookingDate,
      sequenceNumber,
      waitTime,
      name: name || req.user.name,
      phone: phone || req.user.phone,
    });

    // 6. Generate QR code
    token.qrCodeUrl = await generateQR(token, position);
    await token.save();

    // 7. Recalculate queue sorting and notify clients
    await recalculateQueue(serviceSlug, bookingDate);

    // Reload token to get updated values
    const updatedToken = await Token.findById(token._id);
    const finalPosition = await getDynamicPosition(updatedToken);
    
    // Waiting Time = People Ahead * Predicted Service Time
    const peopleAhead = Math.max(0, finalPosition - 1);
    const predictedAvg = await predictAvgServiceTime(serviceSlug, serviceInfo.avgServiceTime || 10);
    const finalWaitTime = peopleAhead * predictedAvg;

    const { emitTokenCreated } = require('../config/socket');
    emitTokenCreated({
      tokenNumber: updatedToken.displayId,
      position: finalPosition,
      estimatedWaitTime: `${finalWaitTime} minutes`,
    });

    const tokenObj = {
      ...updatedToken.toObject(),
      position: finalPosition,
      waitTime: finalWaitTime,
    };

    // Send Alerts (non-blocking)
    const { sendQueueAlertEmail } = require('../services/emailService');
    const { sendWhatsAppAlert } = require('../services/whatsappService');
    sendQueueAlertEmail(req.user.email, tokenObj, 'booked').catch(console.error);
    if (req.user.phone) {
      sendWhatsAppAlert(req.user.phone, tokenObj, 'booked').catch(console.error);
    }

    res.status(201).json({
      success: true,
      data: tokenObj,
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
    const token = await Token.findOne({ displayId }).sort({ createdAt: -1 });

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

/**
 * @desc    Submit a feedback rating for a completed token
 * @route   PUT /api/tokens/:id/rate
 * @access  Private
 */
const rateToken = async (req, res, next) => {
  try {
    const { rating } = req.body;
    
    if (rating === undefined || rating === null) {
      res.status(400);
      throw new Error('Please provide a rating value');
    }
    
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400);
      throw new Error('Rating must be a number between 1 and 5');
    }
    
    const token = await Token.findById(req.params.id);
    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }
    
    // Check if this token belongs to the requesting user
    if (token.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Unauthorized to rate this token');
    }
    
    if (token.status !== 'completed') {
      res.status(400);
      throw new Error('You can only rate a completed token');
    }
    
    token.rating = ratingNum;
    await token.save();
    
    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback rating!',
      data: token
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
  rateToken,
};
