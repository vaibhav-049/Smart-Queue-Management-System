const Token = require('../models/Token');
const Service = require('../models/Service');

const PRIORITY_VALUES = {
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
 * Calculates the estimated waiting time for a new token booking, taking into account priority ordering.
 * @param {string} service - Service slug
 * @param {string} priority - Priority tier ('Normal', 'Senior Citizen', 'VIP', 'Normal')
 * @returns {Promise<{position: number, waitTime: number}>}
 */
const calculateEstimate = async (service, priority = 'Normal', bookingDate) => {
  try {
    const serviceInfo = await Service.findOne({ id: service.toLowerCase() });
    const avgServiceTime = serviceInfo ? serviceInfo.avgServiceTime : 10;

    // Fetch all currently waiting tokens for this specific booking date
    const query = {
      service: service.toLowerCase(),
      status: 'waiting',
    };
    if (bookingDate) {
      query.bookingDate = bookingDate;
    }

    const waitingTokens = await Token.find(query);

    const targetPriorityValue = PRIORITY_VALUES[priority] || 1;

    // A new token is placed:
    // - Behind all existing tokens of higher priority
    // - Behind all existing tokens of the same priority (since they got booked earlier - FIFO)
    // - Ahead of all existing tokens of lower priority
    const tokensAhead = waitingTokens.filter(t => {
      const rank = PRIORITY_VALUES[t.priority] || 1;
      return rank >= targetPriorityValue;
    });

    const newPosition = tokensAhead.length + 1;
    const peopleAhead = tokensAhead.length;
    const waitTime = peopleAhead * avgServiceTime;

    return {
      position: newPosition,
      waitTime,
    };
  } catch (error) {
    console.error('Error calculating waiting time estimate:', error);
    return { position: 1, waitTime: 0 };
  }
};

module.exports = {
  calculateEstimate,
};
