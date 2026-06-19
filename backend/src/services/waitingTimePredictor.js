const Token = require('../models/Token');
const Service = require('../models/Service');

/**
 * AI-Based Waiting Time Predictor
 * Uses a weighted moving average (Exponential Moving Average) of the recently completed tokens
 * to predict the actual service time per department, dynamically adjusting to real-time speed.
 * 
 * @param {string} serviceSlug - ID of the service
 * @param {number} fallbackAvg - Default average from the service model
 * @returns {Promise<number>} Predicted average service time in minutes
 */
const predictAvgServiceTime = async (serviceSlug, fallbackAvg = 10) => {
  try {
    // Fetch last 20 completed tokens for this service that have servedAt and completedAt timestamps
    const recentTokens = await Token.find({
      service: serviceSlug,
      status: 'completed',
      servedAt: { $ne: null },
      completedAt: { $ne: null }
    })
      .sort({ completedAt: -1 })
      .limit(20);

    if (recentTokens.length < 3) {
      // Not enough data to make an AI prediction, fallback to default
      return fallbackAvg;
    }

    let ema = 0;
    const smoothingFactor = 0.3; // Give more weight to recent completions (30% weight to newest)

    // Reverse array to process from oldest to newest for EMA calculation
    const chronologicalTokens = recentTokens.reverse();

    chronologicalTokens.forEach((token, index) => {
      const servedAt = new Date(token.servedAt).getTime();
      const completedAt = new Date(token.completedAt).getTime();
      const serviceTimeInMins = (completedAt - servedAt) / (1000 * 60);

      // Sanity check: cap extreme outliers (e.g., someone left it serving for 5 hours)
      const cappedServiceTime = Math.min(Math.max(serviceTimeInMins, 1), 60);

      if (index === 0) {
        // Initial EMA is just the first value
        ema = cappedServiceTime;
      } else {
        // EMA = (Value * Alpha) + (Previous_EMA * (1 - Alpha))
        ema = (cappedServiceTime * smoothingFactor) + (ema * (1 - smoothingFactor));
      }
    });

    return Math.round(ema);
  } catch (error) {
    console.error('Error in AI Time Prediction:', error);
    return fallbackAvg;
  }
};

module.exports = {
  predictAvgServiceTime,
};
