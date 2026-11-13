const { User, BlockchainTransaction } = require('../models');
const blockchainService = require('../services/blockchainService');
const AuditService = require('../services/auditService');

/**
 * Get all voters (Admin only)
 */
const getVoters = async (req, res, next) => {
  try {
    const voters = await User.find({ role: 'VOTER' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: voters,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get voter by ID (Admin only)
 */
const getVoterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const voter = await User.findOne({ _id: id, role: 'VOTER' }).select('-passwordHash');

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found',
      });
    }

    const transactions = await BlockchainTransaction.find({ userId: voter._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const voterObj = voter.toObject();
    voterObj.transactions = transactions;

    res.status(200).json({
      success: true,
      data: voterObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update voter eligibility (Admin only)
 */
const updateVoterEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isEligible } = req.body;

    const voter = await User.findOne({ _id: id, role: 'VOTER' });

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found',
      });
    }

    voter.isEligible = isEligible;
    await voter.save();

    AuditService.logVoter('VOTER_ELIGIBILITY_UPDATED', voter, req.user, req, { isEligible });

    res.status(200).json({
      success: true,
      message: `Voter ${isEligible ? 'authorized' : 'deauthorized'} successfully`,
      data: {
        id: voter.id,
        voterId: voter.voterId,
        name: voter.name,
        email: voter.email,
        isEligible: voter.isEligible,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize voter on-chain (Admin only)
 */
const authorizeVoterOnChain = async (req, res, next) => {
  try {
    const { id } = req.params;

    const voter = await User.findOne({ _id: id, role: 'VOTER' });

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found',
      });
    }

    if (!voter.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Voter has not linked a Web3 wallet address yet',
      });
    }

    if (!voter.isEligible) {
      return res.status(400).json({
        success: false,
        error: 'Voter is marked as ineligible in the database. Enable eligibility first.',
      });
    }

    const txResult = await blockchainService.authorizeVoter(voter.walletAddress);

    AuditService.logVoter('VOTER_ONCHAIN_AUTHORIZED', voter, req.user, req, {
      walletAddress: voter.walletAddress,
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
    });

    res.status(200).json({
      success: true,
      message: `Voter ${voter.name} successfully authorized on the blockchain`,
      data: {
        voterId: voter.voterId,
        walletAddress: voter.walletAddress,
        blockchainReceipt: txResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch authorize all eligible voters with wallets on-chain (Admin only)
 */
const batchAuthorizeVotersOnChain = async (req, res, next) => {
  try {
    const eligibleVoters = await User.find({
      role: 'VOTER',
      isEligible: true,
      walletAddress: { $ne: null },
    });

    if (eligibleVoters.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No eligible voters with connected wallet addresses found',
      });
    }

    const addresses = eligibleVoters.map((v) => v.walletAddress);
    const txResult = await blockchainService.authorizeVotersInBatch(addresses);

    AuditService.logEvent({
      action: 'VOTERS_BATCH_ONCHAIN_AUTHORIZED',
      category: 'BLOCKCHAIN',
      userId: req.user.id,
      performedBy: req.user.email,
      details: {
        count: addresses.length,
        addresses,
        txHash: txResult.txHash,
      },
      ipAddress: AuditService.getIp(req),
    });

    res.status(200).json({
      success: true,
      message: `Successfully authorized ${addresses.length} voters on the blockchain in batch`,
      data: {
        authorizedCount: addresses.length,
        blockchainReceipt: txResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get voter statistics (Admin only)
 */
const getVoterStats = async (req, res, next) => {
  try {
    const totalVoters = await User.countDocuments({ role: 'VOTER' });
    const eligibleVoters = await User.countDocuments({ role: 'VOTER', isEligible: true });
    const votedCount = await User.countDocuments({ role: 'VOTER', hasVoted: true });
    const withWallet = await User.countDocuments({
      role: 'VOTER',
      walletAddress: { $ne: null },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVoters,
        eligibleVoters,
        votedCount,
        pendingVotes: eligibleVoters - votedCount,
        withWallet,
        turnoutPercentage: eligibleVoters > 0 ? ((votedCount / eligibleVoters) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVoters,
  getVoterById,
  updateVoterEligibility,
  authorizeVoterOnChain,
  batchAuthorizeVotersOnChain,
  getVoterStats,
};
