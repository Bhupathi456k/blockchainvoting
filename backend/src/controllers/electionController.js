const { Election, Candidate, BlockchainTransaction, User } = require('../models');
const blockchainService = require('../services/blockchainService');
const AuditService = require('../services/auditService');

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const computeStatusFromDates = (startTime, endTime, explicitStatus = null) => {
  if (explicitStatus === 'DRAFT' || explicitStatus === 'CANCELLED') {
    return explicitStatus;
  }
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ACTIVE';
  } else {
    return 'ENDED';
  }
};

const autoSyncElectionStatuses = async () => {
  try {
    const now = new Date();
    // Move UPCOMING elections whose startTime has arrived to ACTIVE
    await Election.updateMany(
      {
        status: 'UPCOMING',
        startTime: { $lte: now },
        endTime: { $gte: now },
      },
      { $set: { status: 'ACTIVE' } }
    );

    // Move ACTIVE or UPCOMING elections whose endTime has passed to ENDED
    await Election.updateMany(
      {
        status: { $in: ['UPCOMING', 'ACTIVE'] },
        endTime: { $lt: now },
      },
      { $set: { status: 'ENDED' } }
    );
  } catch (err) {
    console.warn('Status auto-sync warning:', err.message);
  }
};

/**
 * Create a new election (Approved Host or Admin)
 */
const createElection = async (req, res, next) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      type,
      organization,
      category,
      visibility = 'PUBLIC',
      status: reqStatus,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time',
      });
    }

    const initialStatus = computeStatusFromDates(start, end, reqStatus);
    const electionVisibility = (visibility && visibility.toUpperCase() === 'PRIVATE') ? 'PRIVATE' : 'PUBLIC';

    const election = await Election.create({
      title,
      description,
      type,
      organization,
      category,
      startTime: start,
      endTime: end,
      status: initialStatus,
      visibility: electionVisibility,
      hostUserId: req.user.id,
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
 * Get all elections with filtering, search, sorting, and pagination
 */
const getElections = async (req, res, next) => {
  try {
    await autoSyncElectionStatuses();

    const {
      q, // search query
      status, // filter by status
      sort, // sort by field:startTime, endTime, createdAt, title
      page = 1,
      limit = 12,
    } = req.query;

    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) limitNum = 12;

    const offset = (pageNum - 1) * limitNum;

    const isAdmin = req.user && req.user.role === 'ADMIN';
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const conditions = [];

    // 1. Visibility & Ownership Authorization Filter
    if (!isAdmin) {
      const userDiscoveryClause = {
        $or: [
          {
            $and: [
              {
                $or: [
                  { visibility: 'PUBLIC' },
                  { visibility: { $exists: false } },
                  { visibility: null },
                ],
              },
              { status: { $in: ['UPCOMING', 'ACTIVE', 'ENDED'] } },
            ],
          },
          ...(userId ? [{ hostUserId: userId }] : []),
        ],
      };
      conditions.push(userDiscoveryClause);
    }

    // 2. Search Query Filter (q)
    if (q && typeof q === 'string') {
      const searchTerm = q.trim();
      if (searchTerm) {
        const regex = new RegExp(escapeRegex(searchTerm), 'i');
        conditions.push({
          $or: [
            { title: regex },
            { description: regex },
            { type: regex },
            { organization: regex },
            { category: regex },
          ],
        });
      }
    }

    // 3. Status Filter (status)
    if (status && typeof status === 'string') {
      const statusVal = status.trim().toUpperCase();
      if (['DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'].includes(statusVal)) {
        conditions.push({ status: statusVal });
      }
    }

    const finalQuery = conditions.length > 0 ? { $and: conditions } : {};

    let sortObj = { createdAt: -1 };
    if (sort && typeof sort === 'string') {
      const sortParts = sort.split(':');
      const field = sortParts[0];
      const direction = sortParts[1] && sortParts[1].toUpperCase() === 'ASC' ? 1 : -1;
      const allowedFields = ['title', 'startTime', 'endTime', 'createdAt'];
      if (allowedFields.includes(field)) {
        sortObj = { [field]: direction };
      }
    }

    const count = await Election.countDocuments(finalQuery);
    const electionsRaw = await Election.find(finalQuery)
      .sort(sortObj)
      .skip(offset)
      .limit(limitNum);

    const elections = await Promise.all(
      electionsRaw.map(async (el) => {
        const candidates = await Candidate.find({ electionId: el._id }).select('id name party description blockchainCandidateId');
        const elObj = el.toObject();
        elObj.candidates = candidates;
        return elObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        elections,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum) || 1,
        },
      },
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

    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Auto sync status if needed
    if (election.status !== 'DRAFT' && election.status !== 'CANCELLED') {
      const computed = computeStatusFromDates(election.startTime, election.endTime);
      if (computed !== election.status) {
        election.status = computed;
        await election.save();
      }
    }

    const isAdmin = req.user && req.user.role === 'ADMIN';
    const isOwner = req.user && String(election.hostUserId) === String(req.user.id || req.user._id);

    // Enforce visibility: PRIVATE elections are only accessible to Admin or Owner
    if (election.visibility === 'PRIVATE' && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This is a private election.',
      });
    }

    // Enforce DRAFT: DRAFT elections are only accessible to Admin or Owner
    if (election.status === 'DRAFT' && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This election is still in draft mode.',
      });
    }

    const candidates = await Candidate.find({ electionId: election._id });
    const transactions = await BlockchainTransaction.find({ electionId: election._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const elObj = election.toObject();
    elObj.candidates = candidates;
    elObj.transactions = transactions;

    res.status(200).json({
      success: true,
      data: elObj,
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
    await autoSyncElectionStatuses();

    const isAdmin = req.user && req.user.role === 'ADMIN';
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const conditions = [{ status: 'ACTIVE' }];

    if (!isAdmin) {
      conditions.push({
        $or: [
          {
            $or: [
              { visibility: 'PUBLIC' },
              { visibility: { $exists: false } },
              { visibility: null },
            ],
          },
          ...(userId ? [{ hostUserId: userId }] : []),
        ],
      });
    }

    const election = await Election.findOne({ $and: conditions }).sort({ startTime: -1 });

    if (!election) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active election found',
      });
    }

    const candidates = await Candidate.find({ electionId: election._id });
    const elObj = election.toObject();
    elObj.candidates = candidates;

    res.status(200).json({
      success: true,
      data: elObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update election details
 */
const updateElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, type, organization, category, visibility, status } = req.body;

    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    if (election.status === 'ACTIVE' || election.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify election that has already started or ended',
      });
    }

    const newStart = startTime ? new Date(startTime) : election.startTime;
    const newEnd = endTime ? new Date(endTime) : election.endTime;

    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time',
      });
    }

    if (title) election.title = title;
    if (description !== undefined) election.description = description;
    if (type !== undefined) election.type = type;
    if (organization !== undefined) election.organization = organization;
    if (category !== undefined) election.category = category;
    if (visibility !== undefined) election.visibility = visibility;
    if (startTime) election.startTime = newStart;
    if (endTime) election.endTime = newEnd;

    if (status !== undefined) {
      election.status = status;
    } else if (startTime || endTime) {
      election.status = computeStatusFromDates(newStart, newEnd, election.status === 'DRAFT' ? 'DRAFT' : null);
    }

    await election.save();

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
 * Start election
 */
const startElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

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

    const candidates = await Candidate.find({ electionId: election._id });
    if (candidates.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Election must have at least 2 candidates to start',
      });
    }

    election.status = 'ACTIVE';
    await election.save();

    AuditService.logElection('ELECTION_STARTED', election, req.user, req);

    const elObj = election.toObject();
    elObj.candidates = candidates;

    res.status(200).json({
      success: true,
      message: 'Election started successfully',
      data: elObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End election
 */
const endElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

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
 * Delete election
 */
const deleteElection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const election = await Election.findById(id);

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

    await Candidate.deleteMany({ electionId: election._id });
    await BlockchainTransaction.deleteMany({ electionId: election._id });
    await Election.deleteOne({ _id: election._id });

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
    const election = await Election.findById(id);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const candidates = await Candidate.find({ electionId: election._id });

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

    const candidateResults = candidates.map((cand) => {
      let voteCount = 0;
      if (blockchainResults && blockchainResults.candidates) {
        const bcMatch = blockchainResults.candidates.find(
          (c) => c.id === cand.blockchainCandidateId || c.name === cand.name
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

    const resultsWithPercentages = candidateResults.map((c) => ({
      ...c,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0,
    }));

    let maxVotes = 0;
    resultsWithPercentages.forEach((c) => {
      if (c.voteCount > maxVotes) maxVotes = c.voteCount;
    });

    const winners = maxVotes > 0 ? resultsWithPercentages.filter((c) => c.voteCount === maxVotes) : [];
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
