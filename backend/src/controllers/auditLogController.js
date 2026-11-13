const { AuditLog, User } = require('../models');

/**
 * Get audit logs with comprehensive filtering and pagination (Admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      category,
      status,
      userId,
      search,
      startDate,
      endDate,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (parsedPage - 1) * parsedLimit;

    const query = {};

    if (action) query.action = action;
    if (category) query.category = category;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { action: regex },
        { performedBy: regex },
        { targetType: regex },
        { targetId: regex },
        { ipAddress: regex },
      ];
    }

    const count = await AuditLog.countDocuments(query);
    const rawLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(parsedLimit);

    const logs = await Promise.all(
      rawLogs.map(async (l) => {
        const u = l.userId ? await User.findById(l.userId).select('id name email voterId role') : null;
        const lObj = l.toObject();
        lObj.user = u;
        return lObj;
      })
    );

    const totalLogs = count;
    const authLogsCount = await AuditLog.countDocuments({ category: 'AUTH' });
    const electionLogsCount = await AuditLog.countDocuments({ category: 'ELECTION' });
    const securityFailuresCount = await AuditLog.countDocuments({ status: 'FAILURE' });

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit),
        },
        stats: {
          totalLogs,
          authLogsCount,
          electionLogsCount,
          securityFailuresCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export audit logs as CSV or JSON
 */
const exportAuditLogs = async (req, res, next) => {
  try {
    const { format = 'json', limit = 1000 } = req.query;

    const parsedLimit = Math.min(5000, parseInt(limit, 10) || 1000);
    const rawLogs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const logs = await Promise.all(
      rawLogs.map(async (l) => {
        const u = l.userId ? await User.findById(l.userId).select('id name email voterId role') : null;
        const lObj = l.toObject();
        lObj.user = u;
        return lObj;
      })
    );

    if (format === 'csv') {
      const csvHeader = 'ID,Timestamp,Category,Action,Status,PerformedBy,TargetType,TargetId,IPAddress,Details\n';
      const csvRows = logs.map((log) => {
        const detailsStr = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        return [
          log.id,
          `"${new Date(log.createdAt).toISOString()}"`,
          `"${log.category}"`,
          `"${log.action}"`,
          `"${log.status}"`,
          `"${log.performedBy}"`,
          `"${log.targetType || ''}"`,
          `"${log.targetId || ''}"`,
          `"${log.ipAddress || ''}"`,
          `"${detailsStr}"`,
        ].join(',');
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=blockvote_audit_logs_${Date.now()}.csv`);
      return res.status(200).send(csvHeader + csvRows.join('\n'));
    }

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLogs,
};
