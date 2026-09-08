const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new voter
 * @access  Public
 */
router.post(
  '/register',
  [
    body('voterId')
      .trim()
      .notEmpty()
      .withMessage('Voter ID is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Voter ID must be between 3 and 50 characters'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Name must be between 2 and 200 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid phone number format'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('walletAddress')
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid Ethereum wallet address'),
  ],
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (voter or admin)
 * @access  Public
 */
router.post(
  '/login',
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email or Voter ID is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validate,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PATCH /api/auth/wallet
 * @desc    Update wallet address for current user
 * @access  Private
 */
router.patch(
  '/wallet',
  authenticate,
  [
    body('walletAddress')
      .notEmpty()
      .withMessage('Wallet address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid Ethereum wallet address'),
  ],
  validate,
  authController.updateWallet
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
