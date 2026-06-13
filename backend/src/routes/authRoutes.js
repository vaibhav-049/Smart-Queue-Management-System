const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyOTPAndRegister,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const {
  validateBody,
  registerSchema,
  verifyRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../middleware/validationMiddleware');

router.post('/register', authLimiter, validateBody(registerSchema), registerUser);
router.post('/verify-register', authLimiter, validateBody(verifyRegisterSchema), verifyOTPAndRegister);
router.post('/login', authLimiter, validateBody(loginSchema), loginUser);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
