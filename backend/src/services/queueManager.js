const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Service = require('../models/Service');
const { emitQueueUpdate, emitTokenUpdate, emitUserNotification } = require('../config/socket');
const { getLocalDateString } = require('../utils/dateUtils');
const { predictAvgServiceTime } = require('./waitingTimePredictor');

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

/**
 * Re-orders, computes positions, calculates wait times, and updates the active queue document for a service.
 * @param {string} service - Service slug (e.g. 'hospital')
 */
const recalculateQueue = async (service, bookingDate) => {
  try {
    const todayStr = getLocalDateString();
    const targetDate = bookingDate || todayStr;

    // 1. Fetch the service profile to get its default average service time
    const serviceInfo = await Service.findOne({ id: service });
    const defaultAvg = serviceInfo ? serviceInfo.avgServiceTime : 10;

    // AI Prediction
    const avgServiceTime = await predictAvgServiceTime(service, defaultAvg);

    // 2. Fetch all active tokens (serving or waiting) for the target bookingDate
    const activeTokens = await Token.find({
      service,
      status: { $in: ['serving', 'waiting'] },
      bookingDate: targetDate,
    });

    // 3. Separate serving and waiting tokens
    const servingTokens = activeTokens.filter(t => t.status === 'serving');
    const waitingTokens = activeTokens.filter(t => t.status === 'waiting');

    // Helper to calculate dynamic effective rank (Anti-Starvation)
    // Every 45 mins of waiting increases priority rank by 1 (max cap at 4 - Emergency)
    const calculateEffectiveRank = (token) => {
      let baseRank = PRIORITY_RANKS[token.priority] || 1;
      const waitedMinutes = (Date.now() - new Date(token.createdAt).getTime()) / 60000;
      if (waitedMinutes > 45) baseRank += 1;
      if (waitedMinutes > 90) baseRank += 1;
      return Math.min(baseRank, 4);
    };

    // Sort waiting tokens by:
    // a. Effective Priority Rank descending (Aging applied)
    // b. CreatedAt ascending (FIFO for same priority tier)
    waitingTokens.sort((a, b) => {
      const rankA = calculateEffectiveRank(a);
      const rankB = calculateEffectiveRank(b);

      if (rankA !== rankB) {
        return rankB - rankA; // Higher rank first
      }
      return new Date(a.createdAt) - new Date(b.createdAt); // Earlier created first
    });

    // 4. Update the serving tokens in the database
    // Serving tokens always have position = 0 and waitTime = 0
    for (const token of servingTokens) {
      token.waitTime = 0;
      await token.save();
    }

    // 5. Update waiting tokens in the database with their positions and waiting times
    // Position starts from 1 for the first waiting token
    let pos = 1;
    let accumulatedWait = 0; // Iterative wait time tracker for No-Show probability

    for (const token of waitingTokens) {
      const prevWaitTime = token.waitTime;
      
      // Set token's wait time based on accumulated time of tokens ahead
      token.waitTime = accumulatedWait;
      
      // AI No-Show Probability: Reduce added time for the *next* person if this token has a long wait
      let noShowProb = 0;
      if (accumulatedWait > 60) noShowProb = 0.2; // 20% chance they leave
      if (accumulatedWait > 120) noShowProb = 0.3; // 30% chance they leave

      // Add this token's expected time (discounted by its no-show prob) to the total accumulated wait
      accumulatedWait += Math.round(avgServiceTime * (1 - noShowProb));
      
      await token.save();

      // If waitTime changed or position is updated, notify user
      emitTokenUpdate(token.userId, token.displayId, {
        status: token.status,
        position: pos,
        waitTime: token.waitTime,
      });

      // Send a high-priority alert if they are approaching (e.g., 2nd in line) and it is today
      if (pos === 2 && prevWaitTime !== token.waitTime && targetDate === todayStr) {
        emitUserNotification(token.userId, {
          id: Math.random().toString(),
          title: `Your token ${token.displayId} is approaching`,
          message: `You are 2nd in line. Estimated wait: ${token.waitTime} min`,
          time: 'Just now',
          read: false,
          type: 'alert',
        });
      }

      // "Leave Now" Smart Notification (Time drops <= 30 mins)
      if (token.waitTime <= 30 && prevWaitTime > 30 && targetDate === todayStr) {
        emitUserNotification(token.userId, {
          id: Math.random().toString(),
          title: 'Time to leave!',
          message: `Your token ${token.displayId} has an estimated wait of ${token.waitTime} mins. You should start heading to the branch.`,
          time: 'Just now',
          read: false,
          type: 'alert',
        });
        
        // If whatsappService is implemented, we can trigger it here:
        // const { sendWhatsAppMessage } = require('./whatsappService');
        // sendWhatsAppMessage(token.phone, `SmartQueue Alert: It's time to leave! Your token ${token.displayId} has an estimated wait of ${token.waitTime} mins.`);
      }

      pos++;
    }

    // 6. Sync the Queue document for real-time fetch requests ONLY if the targetDate is today
    if (targetDate === todayStr) {
      const currentServingId = servingTokens.length > 0 ? servingTokens[0].displayId : null;
      const upcomingIds = waitingTokens.map(t => t.displayId);

      const queueDoc = await Queue.findOneAndUpdate(
        { service },
        {
          currentServing: currentServingId,
          upcoming: upcomingIds,
          totalInQueue: upcomingIds.length,
          avgWait: avgServiceTime,
        },
        { new: true, upsert: true }
      );

      // 7. Emit live Socket.io updates to the service room
      emitQueueUpdate(service, {
        currentServing: currentServingId,
        upcoming: upcomingIds,
        totalInQueue: upcomingIds.length,
        avgWait: avgServiceTime,
      });

      return queueDoc;
    }

    return null;
  } catch (error) {
    console.error(`Error recalculating queue for service ${service}:`, error);
    throw error;
  }
};

module.exports = {
  recalculateQueue,
};
