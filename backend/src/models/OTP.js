const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      enum: ['register', 'reset_password', 'change_password'],
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

// Hash OTP before saving
otpSchema.pre('save', async function (next) {
  if (!this.isModified('otp')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
  next();
});

// Method to verify OTP
otpSchema.methods.compareOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
