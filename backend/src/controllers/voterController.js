const { User, BlockchainTransaction } = require('../models');

/**
 * Get all voters (Admin only)
 */
const getVoters = async (req, res, next) => {
  try {
    const voters = await User.findAll({
      where: { role: 'VOTER' },
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });

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

    const voter = await User.findOne({
      where: { id, role: 'VOTER' },
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: BlockchainTransaction,
          as: 'transactions',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found',
      });
    }

    res.status(200).json({
      success: true,
      data: voter,
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

    const voter = await User.findOne({
      where: { id, role: 'VOTER' },
    });

    if (!voter) {
      return res.status(404).json({
        success: false,
        error: 'Voter not found',
      });
    }

    voter.isEligible = isEligible;
    await voter.save();

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
 * Get voter statistics (Admin only)
 */
const getVoterStats = async (req, res, next) => {
  try {
    const totalVoters = await User.count({ where: { role: 'VOTER' } });
    const eligibleVoters = await User.count({ where: { role: 'VOTER', isEligible: true } });
    const votedCount = await User.count({ where: { role: 'VOTER', hasVoted: true } });
    const withWallet = await User.count({
      where: {
        role: 'VOTER',
        walletAddress: { [require('sequelize').Op.ne]: null },
      },
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
  getVoterStats,
};
