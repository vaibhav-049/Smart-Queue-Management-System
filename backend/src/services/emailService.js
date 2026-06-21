const { Resend } = require('resend');

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

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

    const resend = getResendClient();
    
    if (!resend) {
      console.warn(`[DEVELOPMENT/FALLBACK] RESEND_API_KEY missing. Printing OTP for ${to}: ${otp}`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: 'SmartQueue <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend API Error:', error);
      console.warn(`[FALLBACK] Failed to send email via Resend. Printing OTP for ${to}: ${otp}`);
      return true; // Don't crash the app, just print OTP in logs
    }

    console.log(`Email sent successfully via Resend to ${to}: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Critical error sending email:', error);
    console.warn(`[FALLBACK] Printing OTP for ${to}: ${otp}`);
    return true; // Fallback to avoid breaking registration
  }
};

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
        subject = `Token Booked - ${displayId}`;
        title = 'Token Successfully Booked! 🎉';
        message = `Your token <strong>${displayId}</strong> for ${service} is booked.<br><br>Position: <strong>#${position}</strong> | Wait time: <strong>${waitTime} mins</strong>.`;
        color = '#10B981';
        break;
      case 'turn_alert':
        subject = `Your turn is NEXT - ${displayId}`;
        title = 'Get Ready! ⏰';
        message = `Your token <strong>${displayId}</strong> is next in line.<br><br>Please proceed to the counter.`;
        color = '#F59E0B';
        break;
      case 'completed':
        subject = `Service Completed - ${displayId}`;
        title = 'Thank you! ✅';
        message = `Service for token <strong>${displayId}</strong> is completed.`;
        color = '#3B82F6';
        break;
      case 'cancelled':
        subject = `Token Cancelled - ${displayId}`;
        title = 'Token Cancelled ❌';
        message = `Your token <strong>${displayId}</strong> has been cancelled.`;
        color = '#EF4444';
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
      </div>
    `;

    const resend = getResendClient();
    if (!resend) return true;

    const { data, error } = await resend.emails.send({
      from: 'SmartQueue <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend Queue Alert Error:', error);
      return false;
    }

    console.log(`Queue Alert Email sent to ${to}: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending queue alert email:', error);
  }
};

const verifyEmailConfig = async () => {
  return true; // HTTP APIs don't need persistent connection verification
};

module.exports = {
  sendOTPEmail,
  sendQueueAlertEmail,
  verifyEmailConfig,
};
