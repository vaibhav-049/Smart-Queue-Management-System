const User = require('../models/User');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          service: user.service,
          avatar: user.avatar,
        },
      });
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          service: updatedUser.service,
          avatar: updatedUser.avatar,
        },
      });
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

const Token = require('../models/Token');

/**
 * @desc    Get user profile statistics (tokens, completed, cancelled/rating)
 * @route   GET /api/users/profile-stats
 * @access  Private
 */
const getUserProfileStats = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'admin') {
      const serviceFilter = user.service ? { service: user.service.toLowerCase() } : {};
      
      const total = await Token.countDocuments(serviceFilter);
      const completed = await Token.countDocuments({ ...serviceFilter, status: 'completed' });
      
      // Calculate average rating
      const ratedTokens = await Token.find({ ...serviceFilter, status: 'completed', rating: { $ne: null } });
      let rating = 0;
      if (ratedTokens.length > 0) {
        const totalRating = ratedTokens.reduce((acc, t) => acc + t.rating, 0);
        rating = Number((totalRating / ratedTokens.length).toFixed(1));
      } else {
        rating = 0; // 0 indicates no ratings yet
      }

      return res.status(200).json({
        success: true,
        data: {
          total,
          completed,
          rating
        }
      });
    } else {
      // Normal Customer
      const total = await Token.countDocuments({ userId: user._id });
      const completed = await Token.countDocuments({ userId: user._id, status: 'completed' });
      const cancelled = await Token.countDocuments({ userId: user._id, status: 'cancelled' });

      return res.status(200).json({
        success: true,
        data: {
          total,
          completed,
          cancelled
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserProfileStats,
};
