const twilio = require('twilio');

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken || accountSid.includes('dummy')) {
    return null; // Silent fail if not configured or using dummy credentials
  }

  return twilio(accountSid, authToken);
};

const formatPhoneNumber = (phone) => {
  // Ensure the number starts with a country code, e.g. +91 for India
  // If no + is present, assume India (+91)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  return null;
};

/**
 * Send Queue Status WhatsApp Alert
 * @param {string} phone - Recipient phone number
 * @param {Object} token - Token details object
 * @param {string} type - 'booked', 'turn_alert', 'completed', 'cancelled'
 */
const sendWhatsAppAlert = async (phone, token, type) => {
  try {
    const client = getTwilioClient();
    if (!client) return; // Not configured

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio default sandbox
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) return;

    const toNumber = `whatsapp:${formattedPhone}`;

    let message = '';
    const { displayId, service, position, waitTime } = token;

    switch (type) {
      case 'booked':
        message = `*SmartQueue Alert* 🎉\n\nYour token *${displayId}* for ${service.toUpperCase()} has been successfully booked.\n\nCurrent Position: *#${position}*\nEst. Wait Time: *${waitTime} mins*\n\nTrack your live status on the app!`;
        break;
      case 'turn_alert':
        message = `*SmartQueue Alert* ⏰\n\nGet ready! Your token *${displayId}* is NEXT in line for the ${service.toUpperCase()} department.\n\nPlease proceed to the counter immediately.`;
        break;
      case 'completed':
        message = `*SmartQueue Alert* ✅\n\nYour service for token *${displayId}* has been completed. Thank you for visiting!`;
        break;
      case 'cancelled':
        message = `*SmartQueue Alert* ❌\n\nYour token *${displayId}* has been cancelled.`;
        break;
      default:
        return;
    }

    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`WhatsApp Alert sent to ${phone}: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp alert:', error.message);
  }
};

module.exports = {
  sendWhatsAppAlert,
};
