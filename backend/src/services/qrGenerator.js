const QRCode = require('qrcode');

/**
 * Generates a base64 Data URL QR Code representing the token details
 * @param {object} tokenData - Token object metadata
 * @returns {Promise<string>} - Base64 Data URL string
 */
const generateQR = async (tokenData, position = 1) => {
  try {
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const payload = {
      token: tokenData.displayId,
      service: capitalize(tokenData.service),
      position: position,
    };

    const payloadString = JSON.stringify(payload);
    
    // Generate QR Code as Data URI
    const dataUrl = await QRCode.toDataURL(payloadString, {
      color: {
        dark: '#1E293B',  // Slate 800
        light: '#FFFFFF', // Transparent/White background
      },
      width: 250,
      margin: 2,
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate token QR code');
  }
};

module.exports = {
  generateQR,
};
