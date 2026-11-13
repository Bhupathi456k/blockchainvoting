const blockchainService = require('../services/blockchainService');
const { BlockchainTransaction, Election, User } = require('../models');
const AuditService = require('../services/auditService');

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

    const dbTx = await BlockchainTransaction.findOne({ transactionHash: txHash });
    let dbTransaction = null;

    if (dbTx) {
      const election = dbTx.electionId ? await Election.findById(dbTx.electionId).select('id title') : null;
      const user = dbTx.userId ? await User.findById(dbTx.userId).select('id name voterId') : null;
      dbTransaction = dbTx.toObject();
      dbTransaction.election = election;
      dbTransaction.user = user;
    }

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

    const query = {};
    if (type) query.transactionType = type;
    if (status) query.status = status;
    if (electionId) query.electionId = electionId;

    const parsedLimit = parseInt(limit, 10) || 50;
    const parsedOffset = parseInt(offset, 10) || 0;

    const count = await BlockchainTransaction.countDocuments(query);
    const rawTxs = await BlockchainTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);

    const transactions = await Promise.all(
      rawTxs.map(async (t) => {
        const election = t.electionId ? await Election.findById(t.electionId).select('id title') : null;
        const user = t.userId ? await User.findById(t.userId).select('id name voterId') : null;
        const tObj = t.toObject();
        tObj.election = election;
        tObj.user = user;
        return tObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        transactions,
        total: count,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a vote transaction
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

    const txInfo = await blockchainService.verifyTransaction(transactionHash);
    if (!txInfo.exists) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found on blockchain',
      });
    }

    const existingTx = await BlockchainTransaction.findOne({ transactionHash });

    if (existingTx) {
      return res.status(409).json({
        success: false,
        error: 'Transaction already recorded',
      });
    }

    const transaction = await BlockchainTransaction.create({
      electionId,
      userId: user._id || user.id,
      transactionHash,
      blockNumber: txInfo.blockNumber,
      transactionType: 'VOTE',
      status: txInfo.status,
      gasUsed: txInfo.gasUsed,
      metadata: { candidateId },
    });

    user.hasVoted = true;
    await user.save();

    AuditService.logBlockchain('VOTE_RECORDED', transactionHash, user, req, {
      electionId,
      candidateId,
      blockNumber: txInfo.blockNumber,
      gasUsed: txInfo.gasUsed,
    });

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
