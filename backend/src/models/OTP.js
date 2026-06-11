const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['register', 'reset_password'],
      required: true,
    },
    // Temporarily store user data during registration
    userData: {
      type: Object,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Document automatically deletes after 10 minutes (600 seconds)
    },
  }
);

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
