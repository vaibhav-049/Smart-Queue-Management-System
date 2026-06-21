const Token = require('../models/Token');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const { generateTokenId } = require('../services/tokenGenerator');
const { calculateEstimate } = require('../services/waitingTimeCalculator');
const { generateQR } = require('../services/qrGenerator');
const { recalculateQueue } = require('../services/queueManager');
const { predictAvgServiceTime } = require('../services/waitingTimePredictor');
const { getLocalDateString, isTimeSlotPast } = require('../utils/dateUtils');


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


const mapIncomingPriority = (priorityType) => {
  const mapping = {
    'Emergency': 'emergency',
    'Senior Citizen': 'senior',
    'VIP': 'vip',
    'Normal': 'normal',
  };
  return mapping[priorityType] || (priorityType ? priorityType.toLowerCase() : 'normal');
};


const bookToken = async (req, res, next) => {
  try {
    const { service, priorityType, priority: priorityField, bookingDate, name, phone } = req.body;
    let { timeSlot } = req.body;

    
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
    maxFutureDate.setDate(today.getDate() + 2); 

    if (bookDate > maxFutureDate) {
      res.status(400);
      throw new Error('Booking is only allowed up to 3 days in advance (today, tomorrow, and day after)');
    }

    const serviceSlug = service.toLowerCase();

    
    const serviceInfo = await Service.findOne({ id: serviceSlug });
    if (!serviceInfo) {
      res.status(404);
      throw new Error(`Service '${service}' not found`);
    }

    
    const queueInfo = await Queue.findOne({ service: serviceSlug });
    if (queueInfo && !queueInfo.isActive) {
      res.status(400);
      throw new Error('Queue for this service is currently closed');
    }

    let priorityTier = mapIncomingPriority(incomingPriority);
    
    
    if (req.user.isVip && req.user.vipValidTill && new Date(req.user.vipValidTill) > new Date()) {
      priorityTier = 'vip';
    }

    
    const activeTokensCount = await Token.countDocuments({
      userId: req.user._id,
      service: serviceSlug,
      bookingDate,
      status: 'waiting'
    });

    if (activeTokensCount >= 2) {
      res.status(429); 
      throw new Error('Anti-Spam Limit: You can only have a maximum of 2 active waiting tokens per service on a given day. Please wait or cancel an existing token.');
    }

    
    if (['vip', 'senior'].includes(priorityTier)) {
      
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

    
    const { displayId, sequenceNumber } = await generateTokenId(serviceSlug, serviceInfo.prefix, bookingDate);

    

    const { position, waitTime } = await calculateEstimate(serviceSlug, incomingPriority, bookingDate);

    
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

    
    token.qrCodeUrl = await generateQR(token, position);
    await token.save();

    
    await recalculateQueue(serviceSlug, bookingDate);

    
    const updatedToken = await Token.findById(token._id);
    const finalPosition = await getDynamicPosition(updatedToken);
    
    
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


const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    
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


const cancelToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    
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
