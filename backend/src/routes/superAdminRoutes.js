const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
  getSuperAdminStats,
  getServicePopularity,
  getAdminsList,
  deleteAdmin,
  getCustomersList,
  getCustomerHistory
} = require('../controllers/superAdminController');

// Super Admin Middleware to ensure the user is an admin but has NO specific service assigned
const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin' && !req.user.service) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as super admin');
  }
};

// All routes here require standard auth + admin role + superadmin check
router.use(protect);
router.use(admin);
router.use(superAdmin);

router.get('/stats', getSuperAdminStats);
router.get('/services-popularity', getServicePopularity);
router.get('/admins', getAdminsList);
router.delete('/admins/:id', deleteAdmin);
router.get('/customers', getCustomersList);
router.get('/customers/:id/history', getCustomerHistory);

module.exports = router;
