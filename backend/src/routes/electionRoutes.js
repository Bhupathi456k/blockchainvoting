const express = require('express');
const { body } = require('express-validator');
const electionController = require('../controllers/electionController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/elections
 * @desc    Create a new election
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Election title is required')
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters'),
    body('description')
      .optional()
      .trim(),
    body('startTime')
      .notEmpty()
      .withMessage('Start time is required')
      .isISO8601()
      .withMessage('Invalid start time format'),
    body('endTime')
      .notEmpty()
      .withMessage('End time is required')
      .isISO8601()
      .withMessage('Invalid end time format'),
  ],
  validate,
  electionController.createElection
);

/**
 * @route   GET /api/elections
 * @desc    Get all elections
 * @access  Private
 */
router.get('/', authenticate, electionController.getElections);

/**
 * @route   GET /api/elections/active
 * @desc    Get currently active election
 * @access  Private
 */
router.get('/active', authenticate, electionController.getActiveElection);

/**
 * @route   GET /api/elections/:id
 * @desc    Get election by ID
 * @access  Private
 */
router.get('/:id', authenticate, electionController.getElectionById);

/**
 * @route   PATCH /api/elections/:id
 * @desc    Update election details
 * @access  Private (Admin)
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 }),
    body('description')
      .optional()
      .trim(),
    body('startTime')
      .optional()
      .isISO8601(),
    body('endTime')
      .optional()
      .isISO8601(),
  ],
  validate,
  electionController.updateElection
);

/**
 * @route   POST /api/elections/:id/start
 * @desc    Start an election
 * @access  Private (Admin)
 */
router.post('/:id/start', authenticate, authorize('ADMIN'), electionController.startElection);

/**
 * @route   POST /api/elections/:id/end
 * @desc    End an election
 * @access  Private (Admin)
 */
router.post('/:id/end', authenticate, authorize('ADMIN'), electionController.endElection);

/**
 * @route   GET /api/elections/:id/results
 * @desc    Get election results
 * @access  Private
 */
router.get('/:id/results', authenticate, electionController.getElectionResults);

module.exports = router;
