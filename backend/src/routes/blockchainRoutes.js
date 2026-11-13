const express = require('express');
const { body } = require('express-validator');
const blockchainController = require('../controllers/blockchainController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/blockchain/status
 * @desc    Get blockchain connection status
 * @access  Public / Optional Auth
 */
router.get('/status', optionalAuth, blockchainController.getBlockchainStatus);

/**
 * @route   GET /api/blockchain/contract
 * @desc    Get smart contract information
 * @access  Public / Optional Auth
 */
router.get('/contract', optionalAuth, blockchainController.getContractInfo);

/**
 * @route   GET /api/blockchain/transactions/:txHash
 * @desc    Verify and get transaction details
 * @access  Private
 */
router.get('/transactions/:txHash', authenticate, blockchainController.verifyTransaction);

/**
 * @route   GET /api/blockchain/transactions
 * @desc    Get transaction history
 * @access  Private (Admin)
 */
router.get('/transactions', authenticate, authorize('ADMIN'), blockchainController.getTransactionHistory);

/**
 * @route   POST /api/blockchain/vote
 * @desc    Record a vote transaction
 * @access  Private
 */
router.post(
  '/vote',
  authenticate,
  [
    body('electionId')
      .notEmpty()
      .withMessage('Election ID is required')
      .isInt()
      .withMessage('Invalid election ID'),
    body('transactionHash')
      .notEmpty()
      .withMessage('Transaction hash is required')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash format'),
    body('candidateId')
      .notEmpty()
      .withMessage('Candidate ID is required')
      .isInt()
      .withMessage('Invalid candidate ID'),
  ],
  validate,
  blockchainController.recordVoteTransaction
);

module.exports = router;
