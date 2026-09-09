const { Op } = require('sequelize');
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

    const whereClause = {};

    if (action) {
      whereClause.action = action;
    }

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { performedBy: { [Op.like]: `%${search}%` } },
        { targetType: { [Op.like]: `%${search}%` } },
        { targetId: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'voterId', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset,
    });

    // Compute category aggregations for analytics
    const totalLogs = count;
    const authLogsCount = await AuditLog.count({ where: { category: 'AUTH' } });
    const electionLogsCount = await AuditLog.count({ where: { category: 'ELECTION' } });
    const securityFailuresCount = await AuditLog.count({ where: { status: 'FAILURE' } });

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

    const logs = await AuditLog.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'voterId', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(5000, parseInt(limit, 10) || 1000),
    });

    if (format === 'csv') {
      const csvHeader = 'ID,Timestamp,Category,Action,Status,PerformedBy,TargetType,TargetId,IPAddress,Details\n';
      const csvRows = logs.map((log) => {
        const detailsStr = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        return [
          log.id,
          `"${log.createdAt.toISOString()}"`,
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
