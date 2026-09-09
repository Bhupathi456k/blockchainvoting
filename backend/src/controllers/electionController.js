const { Election, Candidate, BlockchainTransaction, User } = require('../models');
const blockchainService = require('../services/blockchainService');
const AuditService = require('../services/auditService');

/**
 * Create a new election (Approved Host or Admin)
 */
const createElection = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time',
      });
    }

    const election = await Election.create({
      title,
      description,
      startTime: start,
      endTime: end,
      status: 'DRAFT',
      hostUserId: req.user.id, // Track who created this election
    });

    AuditService.logElection('ELECTION_CREATED', election, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all elections
 */
const getElections = async (req, res, next) => {
  try {
    const elections = await Election.findAll({
      include: [
        {
          model: Candidate,
          as: 'candidates',
          attributes: ['id', 'name', 'party', 'description', 'blockchainCandidateId'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: elections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single election by ID
 */
const getElectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findByPk(id, {
      include: [
        {
          model: Candidate,
          as: 'candidates',
        },
        {
          model: BlockchainTransaction,
          as: 'transactions',
          limit: 10,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    res.status(200).json({
      success: true,
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently active election
 */
const getActiveElection = async (req, res, next) => {
  try {
    const election = await Election.findOne({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Candidate,
          as: 'candidates',
        },
      ],
    });

    if (!election) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active election found',
      });
    }

    res.status(200).json({
      success: true,
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update election details (Owner or Admin, only if not started)
 */
const updateElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime } = req.body;

    const election = await Election.findByPk(id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Ownership check already handled by requireElectionOwner middleware

    if (election.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify election that has already started or ended',
      });
    }

    if (startTime && endTime) {
      if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
          success: false,
          error: 'Start time must be before end time',
        });
      }
    }

    await election.update({
      title: title || election.title,
      description: description !== undefined ? description : election.description,
      startTime: startTime || election.startTime,
      endTime: endTime || election.endTime,
    });

    AuditService.logElection('ELECTION_UPDATED', election, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Election updated successfully',
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start election (Owner or Admin)
 */
const startElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findByPk(id, {
      include: [{ model: Candidate, as: 'candidates' }],
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Ownership check already handled by requireElectionOwner middleware

    if (election.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Election is already active',
      });
    }

    if (election.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot restart an ended election',
      });
    }

    if (election.candidates.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Election must have at least 2 candidates to start',
      });
    }

    election.status = 'ACTIVE';
    await election.save();

    AuditService.logElection('ELECTION_STARTED', election, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Election started successfully',
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End election (Owner or Admin)
 */
const endElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findByPk(id);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Ownership check already handled by requireElectionOwner middleware

    if (election.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Election is not currently active',
      });
    }

    election.status = 'ENDED';
    await election.save();

    AuditService.logElection('ELECTION_ENDED', election, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Election ended successfully',
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete election (Owner or Admin, only before active/with caution)
 */
const deleteElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findByPk(id);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    if (election.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete an active election. End it first.',
      });
    }

    AuditService.logElection('ELECTION_DELETED', election, req.user, req);

    await election.destroy();

    res.status(200).json({
      success: true,
      message: 'Election deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get election results directly calculated from blockchain state
 */
const getElectionResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findByPk(id, {
      include: [{ model: Candidate, as: 'candidates' }],
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Attempt to fetch authoritative results from blockchain
    let blockchainResults = null;
    let dataSource = 'blockchain';

    try {
      if (blockchainService.contract) {
        const results = await blockchainService.getResults();
        blockchainResults = results;
      }
    } catch (err) {
      console.warn('Could not read results directly from contract:', err.message);
      dataSource = 'fallback_empty';
    }

    // Format results
    const candidateResults = election.candidates.map((cand, index) => {
      let voteCount = 0;
      if (blockchainResults && blockchainResults.candidates) {
        const bcMatch = blockchainResults.candidates.find(
          c => c.id === cand.blockchainCandidateId || c.name === cand.name
        );
        if (bcMatch) {
          voteCount = bcMatch.voteCount;
        }
      }

      return {
        id: cand.id,
        blockchainCandidateId: cand.blockchainCandidateId,
        name: cand.name,
        party: cand.party,
        description: cand.description,
        voteCount,
      };
    });

    const totalVotes = candidateResults.reduce((sum, c) => sum + c.voteCount, 0);

    // Calculate percentages and winner
    const resultsWithPercentages = candidateResults.map(c => ({
      ...c,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0,
    }));

    // Find winner(s)
    let maxVotes = 0;
    resultsWithPercentages.forEach(c => {
      if (c.voteCount > maxVotes) maxVotes = c.voteCount;
    });

    const winners = maxVotes > 0 ? resultsWithPercentages.filter(c => c.voteCount === maxVotes) : [];
    const isTie = winners.length > 1;

    res.status(200).json({
      success: true,
      data: {
        election: {
          id: election.id,
          title: election.title,
          description: election.description,
          status: election.status,
          startTime: election.startTime,
          endTime: election.endTime,
        },
        totalVotes,
        dataSource,
        candidates: resultsWithPercentages,
        winner: winners.length === 1 ? winners[0] : null,
        isTie,
        tiedCandidates: isTie ? winners : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createElection,
  getElections,
  getElectionById,
  getActiveElection,
  updateElection,
  startElection,
  endElection,
  deleteElection,
  getElectionResults,
};
