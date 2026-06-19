const Token = require('../models/Token');

const Counter = require('../models/Counter');

/**
 * Generates a unique display ID for a token resetting daily (e.g., A001, A002)
 * @param {string} service - Service slug (e.g., 'hospital')
 * @param {string} prefix - Service token prefix (e.g., 'A')
 * @param {string} bookingDate - Target date (e.g. '2023-10-15')
 * @returns {Promise<{displayId: string, sequenceNumber: number}>}
 */
const generateTokenId = async (service, prefix, bookingDate) => {
  // Use atomic counter to prevent race conditions during concurrent bookings
  const counterId = `token_${service}_${bookingDate}`;
  
  const counter = await Counter.findOneAndUpdate(
    { id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const nextSequence = counter.seq;

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
