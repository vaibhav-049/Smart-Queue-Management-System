const Token = require('../models/Token');

/**
 * Generates a unique display ID for a token resetting daily (e.g., A001, A002)
 * @param {string} service - Service slug (e.g., 'hospital')
 * @param {string} prefix - Service token prefix (e.g., 'A')
 * @returns {Promise<{displayId: string, sequenceNumber: number}>}
 */
const generateTokenId = async (service, prefix) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Find the token with the highest sequence number for this service created today
  const lastTokenToday = await Token.findOne({
    service,
    createdAt: { $gte: startOfToday, $lte: endOfToday },
  })
    .sort({ sequenceNumber: -1 })
    .select('sequenceNumber');

  let nextSequence = 1;
  if (lastTokenToday && lastTokenToday.sequenceNumber) {
    nextSequence = lastTokenToday.sequenceNumber + 1;
  }

  // Format sequence number as 3 digits (e.g. 001, 045, 120)
  const paddedSeq = String(nextSequence).padStart(3, '0');
  const displayId = `${prefix}${paddedSeq}`;

  return {
    displayId,
    sequenceNumber: nextSequence,
  };
};

module.exports = {
  generateTokenId,
};
