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
          color: '#3B82F6',
          description: 'General doctor consultation and checkups',
          prefix: 'H',
          avgServiceTime: 15
        },
        {
          id: 'bank',
          name: 'Bank',
          icon: '🏦',
          color: '#10B981',
          description: 'Account services and cash deposits',
          prefix: 'B',
          avgServiceTime: 10
        },
        {
          id: 'restaurant',
          name: 'Restaurant',
          icon: '🍽️',
          color: '#F59E0B',
          description: 'Table booking and reservations',
          prefix: 'R',
          avgServiceTime: 45
        },
        {
          id: 'government',
          name: 'Government Office',
          icon: '🏛️',
          color: '#8B5CF6',
          description: 'Document processing and queries',
          prefix: 'G',
          avgServiceTime: 20
        }
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
