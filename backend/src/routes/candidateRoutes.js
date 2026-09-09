const express = require('express');
const { body } = require('express-validator');
const candidateController = require('../controllers/candidateController');
const { authenticate, authorize, requireElectionOwner } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/candidates/:electionId
 * @desc    Create candidate for an election
 * @access  Private (Election Owner or Admin)
 */
router.post(
  '/:electionId',
  authenticate,
  requireElectionOwner,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Candidate name is required')
      .isLength({ max: 200 })
      .withMessage('Name must not exceed 200 characters'),
    body('party')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    body('description')
      .optional()
      .trim(),
    body('imageUrl')
      .optional()
      .trim()
      .isURL()
      .withMessage('Invalid image URL'),
  ],
  validate,
  candidateController.createCandidate
);

/**
 * @route   GET /api/candidates/election/:electionId
 * @desc    Get all candidates for an election
 * @access  Private
 */
router.get('/election/:electionId', authenticate, candidateController.getCandidatesByElection);

/**
 * @route   GET /api/candidates/:id
 * @desc    Get single candidate by ID
 * @access  Private
 */
router.get('/:id', authenticate, candidateController.getCandidateById);

/**
 * @route   PATCH /api/candidates/:id
 * @desc    Update candidate
 * @access  Private (Election Owner or Admin)
 */
router.patch(
  '/:id',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    body('party')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    body('description')
      .optional()
      .trim(),
    body('imageUrl')
      .optional()
      .trim()
      .isURL(),
  ],
  validate,
  candidateController.updateCandidate
);

/**
 * @route   DELETE /api/candidates/:id
 * @desc    Delete candidate
 * @access  Private (Election Owner or Admin)
 */
router.delete('/:id', authenticate, candidateController.deleteCandidate);

module.exports = router;
