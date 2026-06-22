const User = require('../models/User');
const Token = require('../models/Token');
const AdminInviteCode = require('../models/AdminInviteCode');

// @desc    Get overall stats for Super Admin
// @route   GET /api/superadmin/stats
// @access  Private/SuperAdmin
const getSuperAdminStats = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin', service: { $ne: null } });
    const totalTokens = await Token.countDocuments();
    
    // Most popular service logic
    const tokensByService = await Token.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    let popularService = 'N/A';
    if (tokensByService.length > 0) {
      popularService = tokensByService[0]._id;
      // capitalize first letter
      popularService = popularService.charAt(0).toUpperCase() + popularService.slice(1);
    }

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalAdmins,
        totalTokens,
        popularService
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service popularity for pie chart
// @route   GET /api/superadmin/services-popularity
// @access  Private/SuperAdmin
const getServicePopularity = async (req, res, next) => {
  try {
    const tokensByService = await Token.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } }
    ]);
    
    const formattedData = tokensByService.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins
// @route   GET /api/superadmin/admins
// @access  Private/SuperAdmin
const getAdminsList = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin', service: { $ne: null } }).select('-password');
    
    // Add tokens completed by each admin
    const adminStats = await Promise.all(admins.map(async (admin) => {
      // Tokens served by this specific admin could be tracked by added "servedBy" field,
      // but since we don't have it, we just count tokens in their service for now or say "N/A".
      // Wait, let's check how many tokens are completed in their service.
      const tokensHandled = await Token.countDocuments({ service: admin.service, status: 'completed' });
      return {
        ...admin.toObject(),
        tokensHandled
      };
    }));

    res.status(200).json({
      success: true,
      data: adminStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Revoke an Admin
// @route   DELETE /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      res.status(404);
      throw new Error('Admin not found');
    }
    
    if (admin.role !== 'admin' || !admin.service) {
      res.status(400);
      throw new Error('Cannot delete super admin or regular users from this endpoint');
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin account revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers
// @route   GET /api/superadmin/customers
// @access  Private/SuperAdmin
const getCustomersList = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'user' }).select('-password');
    
    const customerStats = await Promise.all(customers.map(async (customer) => {
      const totalBookings = await Token.countDocuments({ userId: customer._id });
      return {
        ...customer.toObject(),
        totalBookings
      };
    }));

    res.status(200).json({
      success: true,
      data: customerStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific customer token history
// @route   GET /api/superadmin/customers/:id/history
// @access  Private/SuperAdmin
const getCustomerHistory = async (req, res, next) => {
  try {
    const history = await Token.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuperAdminStats,
  getServicePopularity,
  getAdminsList,
  deleteAdmin,
  getCustomersList,
  getCustomerHistory
};
