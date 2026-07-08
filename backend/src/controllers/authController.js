const jwt = require('jsonwebtoken');
const User = require('../models/User');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const OTP = require('../models/OTP');
const AdminInviteCode = require('../models/AdminInviteCode');
const { sendOTPEmail } = require('../services/emailService');


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, service, accessCode } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400);
      throw new Error('Please enter all required fields');
    }

    // Validate email domain
    const VALID_EMAIL_DOMAINS = [
      'gmail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in',
      'outlook.com', 'hotmail.com', 'live.com',
      'rediffmail.com', 'icloud.com', 'protonmail.com', 'proton.me',
      'zoho.com', 'aol.com', 'mail.com', 'yandex.com',
      'gmx.com', 'tutanota.com', 'fastmail.com',
    ];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain || !VALID_EMAIL_DOMAINS.includes(emailDomain)) {
      res.status(400);
      throw new Error('Please use a valid email provider (e.g. gmail.com, yahoo.com, outlook.com)');
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
      
      if (accessCode === process.env.ADMIN_ACCESS_CODE) {
        
      } else {
        const inviteCode = await AdminInviteCode.findOne({ code: accessCode, isUsed: false });
        if (!inviteCode) {
          return res.status(401).json({ success: false, message: 'Invalid or already used Admin Access Code' });
        }
        if (inviteCode.service !== service.toLowerCase()) {
          return res.status(400).json({ success: false, message: `This invite code is for the ${inviteCode.service} service, not ${service}.` });
        }
        if (new Date() > inviteCode.expiresAt) {
          return res.status(400).json({ success: false, message: 'This invite code has expired.' });
        }
      }
    }

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    
    await OTP.deleteMany({ email, type: 'register' });

    
    const otpCode = generateOTP();
    await OTP.create({
      email,
      otp: otpCode,
      type: 'register',
      userData: { name, email, phone, password, role: role || 'user', service: service || null, accessCode } 
    });

    
    await sendOTPEmail(email, otpCode, 'register');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
    });
  } catch (error) {
    next(error);
  }
};


const verifyOTPAndRegister = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP');
    }

    
    const otpRecord = await OTP.findOne({ email, type: 'register' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const { name, phone, password, role, service, accessCode } = otpRecord.userData;

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'user',
      service: service || null
    });

    
    if (role === 'admin' && accessCode && accessCode !== process.env.ADMIN_ACCESS_CODE) {
      await AdminInviteCode.findOneAndUpdate(
        { code: accessCode },
        { isUsed: true, usedBy: user._id }
      );
    }

    
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


const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter email and password');
    }

    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    
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


const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP, and new password');
    }

    const otpRecord = await OTP.findOne({ email, type: 'reset_password' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) {
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
