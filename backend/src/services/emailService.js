const nodemailer = require('nodemailer');

const getEmailConfig = () => {
  const user = process.env.EMAIL_USER;
  const appPassword = process.env.EMAIL_APP_PASSWORD || process.env.APP_PASSWORD || process.env.app_Password;

  return {
    user,
    pass: appPassword ? appPassword.replace(/\s/g, '') : '',
  };
};

const createTransporter = () => {
  const { user, pass } = getEmailConfig();

  if (!user || !pass) {
    throw new Error('Email configuration is missing. Set EMAIL_USER and EMAIL_APP_PASSWORD (or APP_PASSWORD/app_Password) in backend/.env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const verifyEmailConfig = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
};

/**
 * Send OTP Email
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP
 * @param {string} type - 'register' or 'reset_password'
 */
const sendOTPEmail = async (to, otp, type) => {
  try {
    let subject = '';
    let html = '';

    if (type === 'register') {
      subject = 'Verify Your SmartQueue Registration';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #3B82F6; text-align: center;">Welcome to SmartQueue! ⚡</h2>
          <p>Hello,</p>
          <p>Thank you for registering. Please use the following OTP to verify your email address and complete your registration:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #1e293b; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
          <p>Best regards,<br>The SmartQueue Team</p>
        </div>
      `;
    } else if (type === 'reset_password') {
      subject = 'Reset Your SmartQueue Password';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #F59E0B; text-align: center;">Password Reset Request 🔐</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the following OTP to proceed:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #1e293b; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"SmartQueue System" <${getEmailConfig().user}>`,
      to,
      subject,
      html,
    };

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Could not send OTP email. Please try again later.');
  }
};

/**
 * Send Queue Status Alert Email
 * @param {string} to - Recipient email
 * @param {Object} token - Token details object
 * @param {string} type - 'booked', 'turn_alert', 'completed', 'cancelled'
 */
const sendQueueAlertEmail = async (to, token, type) => {
  try {
    let subject = '';
    let title = '';
    let message = '';
    let color = '#3B82F6';

    const { displayId, service, position, waitTime, timeSlot, bookingDate } = token;
    const dateStr = bookingDate ? new Date(bookingDate).toLocaleDateString() : 'Today';

    switch (type) {
      case 'booked':
        subject = `Token Booked - ${displayId} (${service.toUpperCase()})`;
        title = 'Token Successfully Booked! 🎉';
        message = `Your token <strong>${displayId}</strong> for the ${service} department has been booked for ${dateStr}${timeSlot ? ' at ' + timeSlot : ''}.<br><br>Your current position is <strong>#${position}</strong> and estimated wait time is <strong>${waitTime} mins</strong>.`;
        color = '#10B981'; // Green
        break;
      case 'turn_alert':
        subject = `Your turn is NEXT - ${displayId}`;
        title = 'Get Ready! ⏰';
        message = `Your token <strong>${displayId}</strong> is next in line for the ${service} department.<br><br>Please proceed to the waiting area or counter immediately.`;
        color = '#F59E0B'; // Yellow/Orange
        break;
      case 'completed':
        subject = `Service Completed - ${displayId}`;
        title = 'Thank you for visiting! ✅';
        message = `Your service for token <strong>${displayId}</strong> has been completed. We hope you had a great experience.<br><br>Have a wonderful day!`;
        color = '#3B82F6'; // Blue
        break;
      case 'cancelled':
        subject = `Token Cancelled - ${displayId}`;
        title = 'Token Cancelled ❌';
        message = `Your token <strong>${displayId}</strong> has been cancelled. If you still need service, please book a new token.`;
        color = '#EF4444'; // Red
        break;
      default:
        return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: ${color}; text-align: center;">${title}</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <p style="margin-top: 0; font-size: 16px; color: #334155; line-height: 1.5;">${message}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">Track your live queue status anytime from the SmartQueue dashboard.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CORS_ORIGIN === '*' ? 'http://localhost:5173' : process.env.CORS_ORIGIN}/my-tokens" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Live Status</a>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"SmartQueue System" <${getEmailConfig().user}>`,
      to,
      subject,
      html,
    };

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Queue Alert Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending queue alert email:', error);
    // Non-blocking error for queue flow
  }
};

module.exports = {
  sendOTPEmail,
  sendQueueAlertEmail,
  verifyEmailConfig,
};
