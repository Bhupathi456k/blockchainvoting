const express = require('express');
const { body } = require('express-validator');
const voterController = require('../controllers/voterController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/voters
 * @desc    Get all voters
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('ADMIN'), voterController.getVoters);

/**
 * @route   GET /api/voters/stats
 * @desc    Get voter statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, authorize('ADMIN'), voterController.getVoterStats);

/**
 * @route   GET /api/voters/:id
 * @desc    Get voter by ID
 * @access  Private (Admin)
 */
router.get('/:id', authenticate, authorize('ADMIN'), voterController.getVoterById);

/**
 * @route   PATCH /api/voters/:id/eligibility
 * @desc    Update voter eligibility
 * @access  Private (Admin)
 */
router.patch(
  '/:id/eligibility',
  authenticate,
  authorize('ADMIN'),
  [
    body('isEligible')
      .notEmpty()
      .withMessage('Eligibility status is required')
      .isBoolean()
      .withMessage('Eligibility must be true or false'),
  ],
  validate,
  voterController.updateVoterEligibility
);

module.exports = router;
