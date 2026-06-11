const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Service = require('../models/Service');
const { emitQueueUpdate, emitTokenUpdate, emitUserNotification } = require('../config/socket');

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
const recalculateQueue = async (service) => {
  try {
    // 1. Fetch the service profile to get its average service time
    const serviceInfo = await Service.findOne({ id: service });
    const avgServiceTime = serviceInfo ? serviceInfo.avgServiceTime : 10;

    // 2. Fetch all active tokens (serving or waiting)
    const activeTokens = await Token.find({
      service,
      status: { $in: ['serving', 'waiting'] },
    });

    // 3. Separate serving and waiting tokens
    const servingTokens = activeTokens.filter(t => t.status === 'serving');
    const waitingTokens = activeTokens.filter(t => t.status === 'waiting');

    // Sort waiting tokens by:
    // a. Priority Rank descending (Emergency > Senior Citizen > VIP > Normal)
    // b. CreatedAt ascending (FIFO for same priority tier)
    waitingTokens.sort((a, b) => {
      const rankA = PRIORITY_RANKS[a.priority] || 1;
      const rankB = PRIORITY_RANKS[b.priority] || 1;

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
    for (const token of waitingTokens) {
      const prevWaitTime = token.waitTime;
      token.waitTime = (pos - 1) * avgServiceTime;
      
      await token.save();

      // If waitTime changed or position is updated, notify user
      emitTokenUpdate(token.userId, token.displayId, {
        status: token.status,
        position: pos,
        waitTime: token.waitTime,
      });

      // Send a high-priority alert if they are approaching (e.g., 2nd in line)
      if (pos === 2 && prevWaitTime !== token.waitTime) {
        emitUserNotification(token.userId, {
          id: Math.random().toString(),
          title: `Your token ${token.displayId} is approaching`,
          message: `You are 2nd in line. Estimated wait: ${token.waitTime} min`,
          time: 'Just now',
          read: false,
          type: 'alert',
        });
      }
      pos++;
    }

    // 6. Sync the Queue document for real-time fetch requests
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
  } catch (error) {
    console.error(`Error recalculating queue for service ${service}:`, error);
    throw error;
  }
};

module.exports = {
  recalculateQueue,
};
