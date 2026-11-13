const { User, Election, Candidate, BlockchainTransaction, ElectionHostRequest } = require('../models');
const blockchainService = require('../services/blockchainService');

/**
 * System-wide summary report (Admin only)
 */
const getSystemSummary = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVoters = await User.countDocuments({ role: 'VOTER' });
    const eligibleVoters = await User.countDocuments({ role: 'VOTER', isEligible: true });
    const activeVoters = await User.countDocuments({ hasVoted: true });

    const totalElections = await Election.countDocuments();
    const draftElections = await Election.countDocuments({ status: 'DRAFT' });
    const activeElections = await Election.countDocuments({ status: 'ACTIVE' });
    const endedElections = await Election.countDocuments({ status: 'ENDED' });

    const totalCandidates = await Candidate.countDocuments();
    const totalTransactions = await BlockchainTransaction.countDocuments();
    const confirmedTransactions = await BlockchainTransaction.countDocuments({ status: 'CONFIRMED' });

    const totalHostRequests = await ElectionHostRequest.countDocuments();
    const pendingHostRequests = await ElectionHostRequest.countDocuments({ status: 'PENDING' });
    const approvedHostRequests = await ElectionHostRequest.countDocuments({ status: 'APPROVED' });
    const rejectedHostRequests = await ElectionHostRequest.countDocuments({ status: 'REJECTED' });

    let blockchainStatus = {
      connected: blockchainService.isConnected,
      contractAddress: blockchainService.contractAddress || null,
      provider: blockchainService.provider ? 'Connected' : 'Offline',
    };

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
    const rawElections = await Election.find({}).sort({ createdAt: -1 });
    const eligibleVotersCount = await User.countDocuments({ isEligible: true, role: 'VOTER' });

    const reports = await Promise.all(
      rawElections.map(async (election) => {
        const candidates = await Candidate.find({ electionId: election._id });
        const host = election.hostUserId ? await User.findById(election.hostUserId).select('id name email') : null;

        const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

        let leadingCandidate = null;
        if (candidates.length > 0) {
          const sorted = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
          leadingCandidate = sorted[0];
        }

        const turnoutPercent =
          eligibleVotersCount > 0 ? ((totalVotes / eligibleVotersCount) * 100).toFixed(2) : '0.00';

        return {
          id: election.id,
          title: election.title,
          status: election.status,
          hostName: host ? host.name : 'System Admin',
          startTime: election.startTime,
          endTime: election.endTime,
          candidateCount: candidates.length,
          totalVotes,
          turnoutPercent: `${turnoutPercent}%`,
          leadingCandidate: leadingCandidate
            ? {
                name: leadingCandidate.name,
                party: leadingCandidate.party,
                voteCount: leadingCandidate.voteCount,
              }
            : null,
          candidates: candidates.map((c) => ({
            id: c.id,
            name: c.name,
            party: c.party,
            voteCount: c.voteCount,
            percentage: totalVotes > 0 ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1) + '%' : '0%',
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalElections: rawElections.length,
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
      const rawElections = await Election.find({}).sort({ createdAt: -1 });
      const elections = await Promise.all(
        rawElections.map(async (e) => {
          const candidates = await Candidate.find({ electionId: e._id });
          const host = e.hostUserId ? await User.findById(e.hostUserId).select('name email') : null;
          const eObj = e.toObject();
          eObj.candidates = candidates;
          eObj.host = host;
          return eObj;
        })
      );

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
      const voters = await User.find({})
        .select('id voterId name email phone role hostPermissionStatus isEligible hasVoted createdAt')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        const header = 'ID,Voter ID,Name,Email,Phone,Role,Host Status,Eligible,Has Voted,Registered Date\n';
        const rows = voters.map((v) =>
          [
            v.id,
            `"${v.voterId}"`,
            `"${(v.name || '').replace(/"/g, '""')}"`,
            `"${v.email}"`,
            `"${v.phone || ''}"`,
            `"${v.role}"`,
            `"${v.hostPermissionStatus}"`,
            v.isEligible ? 'YES' : 'NO',
            v.hasVoted ? 'YES' : 'NO',
            `"${new Date(v.createdAt).toISOString()}"`,
          ].join(',')
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=blockvote_voters_${Date.now()}.csv`);
        return res.status(200).send(header + rows.join('\n'));
      }

      return res.status(200).json({ success: true, data: voters });
    }

    const totalUsers = await User.countDocuments();
    const totalElections = await Election.countDocuments();
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
