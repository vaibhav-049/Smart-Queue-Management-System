const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const { validateBody, updateProfileSchema } = require('../middleware/validationMiddleware');

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateBody(updateProfileSchema), updateUserProfile);

module.exports = router;
