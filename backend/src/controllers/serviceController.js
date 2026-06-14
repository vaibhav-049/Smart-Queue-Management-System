const Service = require('../models/Service');

/**
 * @desc    Get all active services
 * @route   GET /api/services
 * @access  Public
 */
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({});
    
    // If no services in DB, create some defaults just so the app works out of the box
    if (services.length === 0) {
      const defaultServices = [
        {
          id: 'hospital',
          name: 'Hospital',
          icon: '🏥',
          color: '#EF4444',
          description: 'Book tokens for hospital OPD, lab tests, and consultations',
          prefix: 'H',
          avgServiceTime: 10,
        },
        {
          id: 'college',
          name: 'College Office',
          icon: '🎓',
          color: '#8B5CF6',
          description: 'Student services, transcript requests, and admissions',
          prefix: 'C',
          avgServiceTime: 15,
        },
        {
          id: 'salon',
          name: 'Salon',
          icon: '💇',
          color: '#EC4899',
          description: 'Haircuts, styling, spa, and beauty services',
          prefix: 'S',
          avgServiceTime: 25,
        },
      ];
      await Service.insertMany(defaultServices);
      return res.status(200).json({
        success: true,
        data: defaultServices,
      });
    }

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
};
