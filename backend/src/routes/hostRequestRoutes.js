const express = require('express');
const { body } = require('express-validator');
const hostRequestController = require('../controllers/hostRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/host-requests
 * @desc    Submit a request to become an election host
 * @access  Private (Authenticated User)
 */
router.post(
  '/',
  authenticate,
  [
    body('electionTitle')
      .trim()
      .notEmpty()
      .withMessage('Election title is required')
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters'),
    body('electionDescription')
      .optional()
      .trim(),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('Election purpose is required'),
    body('expectedVoters')
      .notEmpty()
      .withMessage('Expected number of voters is required')
      .isInt({ min: 1 })
      .withMessage('Expected voters must be an integer of at least 1'),
    body('proposedStartDate')
      .notEmpty()
      .withMessage('Proposed start date is required')
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('proposedEndDate')
      .notEmpty()
      .withMessage('Proposed end date is required')
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('electionType')
      .optional()
      .trim(),
    body('additionalInformation')
      .optional()
      .trim(),
  ],
  validate,
  hostRequestController.submitHostRequest
);

/**
 * @route   GET /api/host-requests/me
 * @desc    Get current user's host requests & status
 * @access  Private (Authenticated User)
 */
router.get('/me', authenticate, hostRequestController.getMyHostRequests);

/**
 * @route   GET /api/host-requests
 * @desc    Get all host requests (Admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('ADMIN'), hostRequestController.getAllHostRequests);

/**
 * @route   GET /api/host-requests/:id
 * @desc    Get single host request by ID
 * @access  Private (Admin or Requester)
 */
router.get('/:id', authenticate, hostRequestController.getHostRequestById);

/**
 * @route   POST /api/host-requests/:id/approve
 * @desc    Approve host request
 * @access  Private (Admin)
 */
router.post('/:id/approve', authenticate, authorize('ADMIN'), hostRequestController.approveHostRequest);

/**
 * @route   POST /api/host-requests/:id/reject
 * @desc    Reject host request
 * @access  Private (Admin)
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  [
    body('adminReason')
      .optional()
      .trim(),
  ],
  validate,
  hostRequestController.rejectHostRequest
);

module.exports = router;
