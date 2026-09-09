const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Base method to record an audit log entry (failsafe, will not throw to caller)
   */
  static async logEvent({
    action,
    category = 'GENERAL',
    userId = null,
    performedBy = 'SYSTEM',
    targetType = null,
    targetId = null,
    details = {},
    ipAddress = null,
    status = 'SUCCESS',
  }) {
    try {
      const entry = await AuditLog.create({
        action,
        category,
        userId,
        performedBy,
        targetType,
        targetId: targetId ? String(targetId) : null,
        details,
        ipAddress,
        status,
      });
      return entry;
    } catch (err) {
      console.error('⚠️ [AuditService] Failed to record audit log:', err.message);
      return null;
    }
  }

  /**
   * Helper to extract IP from Express request
   */
  static getIp(req) {
    if (!req) return null;
    return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null;
  }

  /**
   * Log authentication actions (login, register, failed login, logout)
   */
  static async logAuth(action, user, req, details = {}, status = 'SUCCESS') {
    const performedBy = user ? (user.email || user.voterId || user.name) : (req?.body?.identifier || 'Anonymous');
    const userId = user ? user.id : null;
    return this.logEvent({
      action,
      category: 'AUTH',
      userId,
      performedBy,
      targetType: 'User',
      targetId: userId,
      details: {
        ...details,
        userAgent: req?.headers ? req.headers['user-agent'] : undefined,
      },
      ipAddress: this.getIp(req),
      status,
    });
  }

  /**
   * Log Election actions (create, update, start, end, delete)
   */
  static async logElection(action, election, user, req, details = {}) {
    const performedBy = user ? (user.email || user.name) : 'SYSTEM';
    return this.logEvent({
      action,
      category: 'ELECTION',
      userId: user ? user.id : null,
      performedBy,
      targetType: 'Election',
      targetId: election?.id,
      details: {
        electionTitle: election?.title,
        status: election?.status,
        ...details,
      },
      ipAddress: this.getIp(req),
      status: 'SUCCESS',
    });
  }

  /**
   * Log Host Request actions (submitted, approved, rejected)
   */
  static async logHostRequest(action, hostRequest, reviewerUser, req, details = {}) {
    const performedBy = reviewerUser ? (reviewerUser.email || reviewerUser.name) : 'User';
    return this.logEvent({
      action,
      category: 'HOST_REQUEST',
      userId: reviewerUser ? reviewerUser.id : (hostRequest?.userId || null),
      performedBy,
      targetType: 'ElectionHostRequest',
      targetId: hostRequest?.id,
      details: {
        electionTitle: hostRequest?.electionTitle,
        requestStatus: hostRequest?.status,
        requesterId: hostRequest?.userId,
        ...details,
      },
      ipAddress: this.getIp(req),
      status: 'SUCCESS',
    });
  }

  /**
   * Log Candidate actions (created, updated, deleted)
   */
  static async logCandidate(action, candidate, user, req, details = {}) {
    const performedBy = user ? (user.email || user.name) : 'SYSTEM';
    return this.logEvent({
      action,
      category: 'CANDIDATE',
      userId: user ? user.id : null,
      performedBy,
      targetType: 'Candidate',
      targetId: candidate?.id,
      details: {
        candidateName: candidate?.name,
        party: candidate?.party,
        electionId: candidate?.electionId,
        ...details,
      },
      ipAddress: this.getIp(req),
      status: 'SUCCESS',
    });
  }

  /**
   * Log Voter status modifications (eligibility toggle, on-chain authorization)
   */
  static async logVoter(action, voterUser, adminUser, req, details = {}) {
    const performedBy = adminUser ? (adminUser.email || adminUser.name) : 'ADMIN';
    return this.logEvent({
      action,
      category: 'VOTER',
      userId: adminUser ? adminUser.id : null,
      performedBy,
      targetType: 'User',
      targetId: voterUser?.id,
      details: {
        voterEmail: voterUser?.email,
        voterId: voterUser?.voterId,
        ...details,
      },
      ipAddress: this.getIp(req),
      status: 'SUCCESS',
    });
  }

  /**
   * Log blockchain operations (vote cast, transaction verification)
   */
  static async logBlockchain(action, txHash, user, req, details = {}) {
    const performedBy = user ? (user.email || user.name) : 'Voter';
    return this.logEvent({
      action,
      category: 'BLOCKCHAIN',
      userId: user ? user.id : null,
      performedBy,
      targetType: 'BlockchainTransaction',
      targetId: txHash,
      details: {
        txHash,
        ...details,
      },
      ipAddress: this.getIp(req),
      status: 'SUCCESS',
    });
  }
}

module.exports = AuditService;
