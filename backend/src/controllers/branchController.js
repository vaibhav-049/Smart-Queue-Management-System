const Branch = require('../models/Branch');

const getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true });
    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBranches,
};
