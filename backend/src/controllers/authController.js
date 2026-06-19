const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../services/emailService');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * @desc    Send OTP for new user registration
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, service, accessCode } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400);
      throw new Error('Please enter all required fields');
    }

    if (role === 'admin') {
      if (!service) {
        res.status(400);
        throw new Error('Please select a service for the administrator account');
      }
      if (!['hospital', 'college', 'salon'].includes(service.toLowerCase())) {
        res.status(400);
        throw new Error('Invalid service selection');
      }
      if (!process.env.ADMIN_ACCESS_CODE) {
        return res.status(500).json({ success: false, message: 'Server configuration error: Admin registration is disabled.' });
      }

      if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
        return res.status(401).json({ success: false, message: 'Invalid Admin Access Code' });
      }
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // Delete any existing register OTPs for this email
    await OTP.deleteMany({ email, type: 'register' });

    // Generate and save new OTP
    const otpCode = generateOTP();
    await OTP.create({
      email,
      otp: otpCode,
      type: 'register',
      userData: { name, email, phone, password, role: role || 'user', service: service || null } // Store temporarily
    });

    // Send email
    await sendOTPEmail(email, otpCode, 'register');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and finalize registration
 * @route   POST /api/auth/verify-register
 * @access  Public
 */
const verifyOTPAndRegister = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP');
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email, otp, type: 'register' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const { name, phone, password, role, service } = otpRecord.userData;

    // Double check user doesn't exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'user',
      service: service || null
    });

    // Delete the OTP record so it can't be reused
    await OTP.deleteOne({ _id: otpRecord._id });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          token: generateToken(user._id),
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            service: user.service,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    res.status(200).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          service: user.service,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Password Reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('No user found with this email');
    }

    await OTP.deleteMany({ email, type: 'reset_password' });
    const otpCode = generateOTP();
    await OTP.create({ email, otp: otpCode, type: 'reset_password' });

    await sendOTPEmail(email, otpCode, 'reset_password');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP, and new password');
    }

    const otpRecord = await OTP.findOne({ email, otp, type: 'reset_password' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
    
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  verifyOTPAndRegister,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
};
