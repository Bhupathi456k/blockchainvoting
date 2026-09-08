const { Candidate, Election } = require('../models');

/**
 * Create candidate for an election (Admin only)
 */
const createCandidate = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const { name, party, description, imageUrl } = req.body;

    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    if (election.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot add candidates to an election that has already started',
      });
    }

    const candidate = await Candidate.create({
      electionId,
      name,
      party,
      description,
      imageUrl,
    });

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

    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const candidates = await Candidate.findAll({
      where: { electionId },
      order: [['id', 'ASC']],
    });

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

    const candidate = await Candidate.findByPk(id, {
      include: [{ model: Election, as: 'election' }],
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update candidate (Admin only, only before election starts)
 */
const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, party, description, imageUrl } = req.body;

    const candidate = await Candidate.findByPk(id, {
      include: [{ model: Election, as: 'election' }],
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    if (candidate.election.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify candidates after election has started',
      });
    }

    await candidate.update({
      name: name || candidate.name,
      party: party !== undefined ? party : candidate.party,
      description: description !== undefined ? description : candidate.description,
      imageUrl: imageUrl !== undefined ? imageUrl : candidate.imageUrl,
    });

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
 * Delete candidate (Admin only, only before election starts)
 */
const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findByPk(id, {
      include: [{ model: Election, as: 'election' }],
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    if (candidate.election.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete candidates after election has started',
      });
    }

    await candidate.destroy();

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
