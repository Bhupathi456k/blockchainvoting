const blockchainService = require('../services/blockchainService');
const { BlockchainTransaction, Election, User } = require('../models');

/**
 * Get blockchain connection status
 */
const getBlockchainStatus = async (req, res, next) => {
  try {
    const status = await blockchainService.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract information
 */
const getContractInfo = async (req, res, next) => {
  try {
    if (!blockchainService.contract) {
      return res.status(200).json({
        success: true,
        data: {
          deployed: false,
          message: 'Smart contract not connected. Please deploy the contract and configure CONTRACT_ADDRESS.',
        },
      });
    }

    const status = await blockchainService.getElectionStatus();

    res.status(200).json({
      success: true,
      data: {
        deployed: true,
        address: blockchainService.contractAddress,
        status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a blockchain transaction
 */
const verifyTransaction = async (req, res, next) => {
  try {
    const { txHash } = req.params;

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format',
      });
    }

    const txInfo = await blockchainService.verifyTransaction(txHash);

    if (!txInfo.exists) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found on blockchain',
      });
    }

    // Check if we have this transaction in our database
    const dbTransaction = await BlockchainTransaction.findOne({
      where: { transactionHash: txHash },
      include: [
        { model: Election, as: 'election', attributes: ['id', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'voterId'] },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        blockchain: txInfo,
        database: dbTransaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction history
 */
const getTransactionHistory = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, type, status, electionId } = req.query;

    const where = {};
    if (type) where.transactionType = type;
    if (status) where.status = status;
    if (electionId) where.electionId = electionId;

    const transactions = await BlockchainTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Election, as: 'election', attributes: ['id', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'voterId'] },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.rows,
        total: transactions.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a vote transaction (called from voting workflow)
 */
const recordVoteTransaction = async (req, res, next) => {
  try {
    const { electionId, transactionHash, candidateId } = req.body;
    const user = req.user;

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet address linked to this account',
      });
    }

    // Verify transaction exists on blockchain
    const txInfo = await blockchainService.verifyTransaction(transactionHash);
    if (!txInfo.exists) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found on blockchain',
      });
    }

    // Check for duplicate transaction
    const existingTx = await BlockchainTransaction.findOne({
      where: { transactionHash },
    });

    if (existingTx) {
      return res.status(409).json({
        success: false,
        error: 'Transaction already recorded',
      });
    }

    // Create transaction record
    const transaction = await BlockchainTransaction.create({
      electionId,
      userId: user.id,
      transactionHash,
      blockNumber: txInfo.blockNumber,
      transactionType: 'VOTE',
      status: txInfo.status,
      gasUsed: txInfo.gasUsed,
      metadata: { candidateId },
    });

    // Update user voting status
    user.hasVoted = true;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Vote transaction recorded successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlockchainStatus,
  getContractInfo,
  verifyTransaction,
  getTransactionHistory,
  recordVoteTransaction,
};
