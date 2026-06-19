const Token = require('../models/Token');
const User = require('../models/User');
const { sendQueueAlertEmail } = require('./emailService');
const { sendWhatsAppAlert } = require('./whatsappService');

/**
 * Send alerts for a specific token event
 * @param {string} tokenId - ID of the token in DB
 * @param {string} type - 'booked', 'turn_alert', 'completed', 'cancelled'
 */
const sendTokenAlerts = async (tokenId, type) => {
  try {
    const token = await Token.findById(tokenId);
    if (!token) return;

    const user = await User.findById(token.userId);
    if (!user) return;

    const tokenObj = token.toObject();

    // Send Email
    if (user.email) {
      sendQueueAlertEmail(user.email, tokenObj, type).catch(console.error);
    }

    // Send WhatsApp
    if (user.phone) {
      sendWhatsAppAlert(user.phone, tokenObj, type).catch(console.error);
    }
  } catch (error) {
    console.error(`Error sending token alerts for type ${type}:`, error);
  }
};

module.exports = {
  sendTokenAlerts,
};
