const { User, Election, Candidate, BlockchainTransaction, ElectionHostRequest } = require('../models');
const blockchainService = require('../services/blockchainService');

/**
 * System-wide summary report (Admin only)
 */
const getSystemSummary = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalVoters = await User.count({ where: { role: 'VOTER' } });
    const eligibleVoters = await User.count({ where: { role: 'VOTER', isEligible: true } });
    const activeVoters = await User.count({ where: { hasVoted: true } });

    const totalElections = await Election.count();
    const draftElections = await Election.count({ where: { status: 'DRAFT' } });
    const activeElections = await Election.count({ where: { status: 'ACTIVE' } });
    const endedElections = await Election.count({ where: { status: 'ENDED' } });

    const totalCandidates = await Candidate.count();
    const totalTransactions = await BlockchainTransaction.count();
    const confirmedTransactions = await BlockchainTransaction.count({ where: { status: 'CONFIRMED' } });

    const totalHostRequests = await ElectionHostRequest.count();
    const pendingHostRequests = await ElectionHostRequest.count({ where: { status: 'PENDING' } });
    const approvedHostRequests = await ElectionHostRequest.count({ where: { status: 'APPROVED' } });
    const rejectedHostRequests = await ElectionHostRequest.count({ where: { status: 'REJECTED' } });

    // Blockchain status
    let blockchainStatus = {
      connected: blockchainService.isConnected,
      contractAddress: blockchainService.contractAddress || null,
      provider: blockchainService.provider ? 'Connected' : 'Offline',
    };

    // Calculate voter participation rate
    const voterTurnoutRate = eligibleVoters > 0 ? ((activeVoters / eligibleVoters) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        voters: {
          total: totalUsers,
          voterAccounts: totalVoters,
          eligible: eligibleVoters,
          hasVotedCount: activeVoters,
          turnoutRate: `${voterTurnoutRate}%`,
        },
        elections: {
          total: totalElections,
          draft: draftElections,
          active: activeElections,
          ended: endedElections,
          totalCandidates,
        },
        hostRequests: {
          total: totalHostRequests,
          pending: pendingHostRequests,
          approved: approvedHostRequests,
          rejected: rejectedHostRequests,
        },
        blockchain: {
          totalTransactions,
          confirmedTransactions,
          ...blockchainStatus,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Per-election detailed analytics report
 */
const getElectionReports = async (req, res, next) => {
  try {
    const elections = await Election.findAll({
      include: [
        { model: Candidate, as: 'candidates' },
        { model: User, as: 'host', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const eligibleVotersCount = await User.count({ where: { isEligible: true, role: 'VOTER' } });

    const reports = elections.map((election) => {
      const candidates = election.candidates || [];
      const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

      let leadingCandidate = null;
      if (candidates.length > 0) {
        const sorted = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
        leadingCandidate = sorted[0];
      }

      const turnoutPercent = eligibleVotersCount > 0
        ? ((totalVotes / eligibleVotersCount) * 100).toFixed(2)
        : '0.00';

      return {
        id: election.id,
        title: election.title,
        status: election.status,
        hostName: election.host ? election.host.name : 'System Admin',
        startTime: election.startTime,
        endTime: election.endTime,
        candidateCount: candidates.length,
        totalVotes,
        turnoutPercent: `${turnoutPercent}%`,
        leadingCandidate: leadingCandidate ? {
          name: leadingCandidate.name,
          party: leadingCandidate.party,
          voteCount: leadingCandidate.voteCount,
        } : null,
        candidates: candidates.map((c) => ({
          id: c.id,
          name: c.name,
          party: c.party,
          voteCount: c.voteCount,
          percentage: totalVotes > 0 ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1) + '%' : '0%',
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalElections: elections.length,
        eligibleVotersCount,
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export reports as CSV or JSON
 */
const exportReport = async (req, res, next) => {
  try {
    const { type = 'elections', format = 'json' } = req.query;

    if (type === 'elections') {
      const elections = await Election.findAll({
        include: [
          { model: Candidate, as: 'candidates' },
          { model: User, as: 'host', attributes: ['name', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (format === 'csv') {
        const header = 'Election ID,Title,Status,Host Name,Candidates Count,Total Votes,Start Time,End Time\n';
        const rows = elections.map((e) => {
          const totalVotes = (e.candidates || []).reduce((sum, c) => sum + (c.voteCount || 0), 0);
          return [
            e.id,
            `"${(e.title || '').replace(/"/g, '""')}"`,
            `"${e.status}"`,
            `"${e.host ? e.host.name.replace(/"/g, '""') : 'System Admin'}"`,
            (e.candidates || []).length,
            totalVotes,
            `"${e.startTime ? new Date(e.startTime).toISOString() : ''}"`,
            `"${e.endTime ? new Date(e.endTime).toISOString() : ''}"`,
          ].join(',');
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=blockvote_elections_${Date.now()}.csv`);
        return res.status(200).send(header + rows.join('\n'));
      }

      return res.status(200).json({ success: true, data: elections });
    }

    if (type === 'voters') {
      const voters = await User.findAll({
        attributes: ['id', 'voterId', 'name', 'email', 'phone', 'role', 'hostPermissionStatus', 'isEligible', 'hasVoted', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });

      if (format === 'csv') {
        const header = 'ID,Voter ID,Name,Email,Phone,Role,Host Status,Eligible,Has Voted,Registered Date\n';
        const rows = voters.map((v) => [
          v.id,
          `"${v.voterId}"`,
          `"${(v.name || '').replace(/"/g, '""')}"`,
          `"${v.email}"`,
          `"${v.phone || ''}"`,
          `"${v.role}"`,
          `"${v.hostPermissionStatus}"`,
          v.isEligible ? 'YES' : 'NO',
          v.hasVoted ? 'YES' : 'NO',
          `"${v.createdAt.toISOString()}"`,
        ].join(','));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=blockvote_voters_${Date.now()}.csv`);
        return res.status(200).send(header + rows.join('\n'));
      }

      return res.status(200).json({ success: true, data: voters });
    }

    // Default: system summary as json
    const totalUsers = await User.count();
    const totalElections = await Election.count();
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalElections,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemSummary,
  getElectionReports,
  exportReport,
};
