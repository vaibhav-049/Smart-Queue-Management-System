const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay instance safely (checking for env vars)
let razorpayInstance = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn('Razorpay could not be initialized. Missing or invalid credentials.');
}

/**
 * @desc    Create a Razorpay order for VIP Upgrade
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res, next) => {
  try {
    if (!razorpayInstance) {
      res.status(500);
      throw new Error('Payment gateway is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
    }

    // VIP Plan price: 99 INR
    const options = {
      amount: 99 * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${req.user._id}_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment and upgrade user to VIP
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Incomplete payment details');
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      res.status(500);
      throw new Error('Payment gateway secret key is missing');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful, upgrade user to VIP for 30 days
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // Valid for 30 days

      user.isVip = true;
      user.vipValidTill = expiryDate;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully. You are now a VIP member!',
        data: {
          isVip: user.isVip,
          vipValidTill: user.vipValidTill,
        },
      });
    } else {
      res.status(400);
      throw new Error('Payment signature verification failed');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
