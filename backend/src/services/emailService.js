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

module.exports = {
  sendOTPEmail,
  verifyEmailConfig,
};
