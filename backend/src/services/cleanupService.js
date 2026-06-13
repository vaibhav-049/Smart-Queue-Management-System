const Token = require('../models/Token');
const { getLocalDateString, isTimeSlotPast } = require('../utils/dateUtils');
const { recalculateQueue } = require('./queueManager');

const runCleanup = async () => {
  try {
    const todayStr = getLocalDateString();
    console.log(`[Cleanup Service] Running stale/expired/cancelled token cleanup...`);

    // 1. Delete all tokens with status in ['waiting', 'serving', 'cancelled', 'expired'] where bookingDate is in the past
    const pastDateResult = await Token.deleteMany({
      bookingDate: { $lt: todayStr },
      status: { $in: ['waiting', 'serving', 'cancelled', 'expired'] }
    });

    // 2. Fetch today's tokens with status in ['waiting', 'serving', 'cancelled'] and check if their time slot is in the past
    const todayTokens = await Token.find({
      bookingDate: todayStr,
      status: { $in: ['waiting', 'serving', 'cancelled'] }
    });

    let todayDeletedCount = 0;
    const servicesToRecalculate = new Set();
    
    for (const token of todayTokens) {
      if (isTimeSlotPast(token.bookingDate, token.timeSlot)) {
        await Token.deleteOne({ _id: token._id });
        servicesToRecalculate.add(token.service);
        todayDeletedCount++;
        console.log(`[Cleanup Service] Deleted expired token ${token.displayId} (Time slot: ${token.timeSlot} passed).`);
      }
    }

    // Recalculate queue for any services that had tokens expire today
    for (const service of servicesToRecalculate) {
      await recalculateQueue(service, todayStr);
    }

    const totalDeleted = (pastDateResult.deletedCount || 0) + todayDeletedCount;
    if (totalDeleted > 0) {
      console.log(`[Cleanup Service] Successfully deleted ${totalDeleted} stale/expired/cancelled tokens.`);
    } else {
      console.log(`[Cleanup Service] No stale/expired/cancelled tokens to delete.`);
    }
  } catch (error) {
    console.error('[Cleanup Service] Error during token cleanup:', error);
  }
};

const startCleanupInterval = () => {
  // Run once immediately on startup
  runCleanup();
  
  // Then run every 10 minutes (10 * 60 * 1000 ms)
  const intervalMs = 10 * 60 * 1000;
  setInterval(runCleanup, intervalMs);
  console.log('[Cleanup Service] Background token cleanup interval started (running every 10 mins).');
};

module.exports = {
  runCleanup,
  startCleanupInterval
};
