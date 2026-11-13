const { Candidate, Election } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Create candidate for an election (Owner or Admin)
 */
const createCandidate = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const { name, party, description, imageUrl } = req.body;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    if (election.status === 'ACTIVE' || election.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot add candidates to an election that has already started or ended',
      });
    }

    const candidate = await Candidate.create({
      electionId,
      name,
      party,
      description,
      imageUrl,
    });

    AuditService.logCandidate('CANDIDATE_CREATED', candidate, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all candidates for an election
 */
const getCandidatesByElection = async (req, res, next) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const candidates = await Candidate.find({ electionId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single candidate by ID
 */
const getCandidateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    const election = await Election.findById(candidate.electionId);
    const candObj = candidate.toObject();
    candObj.election = election;

    res.status(200).json({
      success: true,
      data: candObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update candidate
 */
const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, party, description, imageUrl } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    const election = await Election.findById(candidate.electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Associated election not found',
      });
    }

    if (req.user.role !== 'ADMIN' && String(election.hostUserId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this candidate',
      });
    }

    if (election.status === 'ACTIVE' || election.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify candidates after election has started or ended',
      });
    }

    if (name) candidate.name = name;
    if (party !== undefined) candidate.party = party;
    if (description !== undefined) candidate.description = description;
    if (imageUrl !== undefined) candidate.imageUrl = imageUrl;

    await candidate.save();

    AuditService.logCandidate('CANDIDATE_UPDATED', candidate, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete candidate
 */
const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    const election = await Election.findById(candidate.electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Associated election not found',
      });
    }

    if (req.user.role !== 'ADMIN' && String(election.hostUserId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this candidate',
      });
    }

    if (election.status === 'ACTIVE' || election.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete candidates after election has started or ended',
      });
    }

    AuditService.logCandidate('CANDIDATE_DELETED', candidate, req.user, req);

    await Candidate.deleteOne({ _id: candidate._id });

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCandidate,
  getCandidatesByElection,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
};
