const { ElectionHostRequest, User } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Submit a new election hosting request (User)
 */
const submitHostRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      electionTitle,
      electionDescription,
      purpose,
      expectedVoters,
      proposedStartDate,
      proposedEndDate,
      electionType,
      additionalInformation,
    } = req.body;

    // Check if user already has an active PENDING request
    const existingPending = await ElectionHostRequest.findOne({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending host request under review. Please wait for an administrator to review it.',
      });
    }

    // Check date validation
    const start = new Date(proposedStartDate);
    const end = new Date(proposedEndDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Proposed start date must be before proposed end date',
      });
    }

    // Create the request
    const hostRequest = await ElectionHostRequest.create({
      userId,
      electionTitle,
      electionDescription,
      purpose,
      expectedVoters: parseInt(expectedVoters, 10),
      proposedStartDate: start,
      proposedEndDate: end,
      electionType: electionType || 'General Election',
      additionalInformation,
      status: 'PENDING',
    });

    // Update user's hostPermissionStatus to PENDING
    await User.update(
      { hostPermissionStatus: 'PENDING' },
      { where: { id: userId } }
    );

    AuditService.logHostRequest('HOST_REQUEST_CREATED', hostRequest, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Election hosting request submitted successfully and is pending administrator review',
      data: hostRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's host requests
 */
const getMyHostRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const requests = await ElectionHostRequest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    // Also get current user's status
    const user = await User.findByPk(userId, {
      attributes: ['id', 'hostPermissionStatus'],
    });

    res.status(200).json({
      success: true,
      data: {
        hostPermissionStatus: user.hostPermissionStatus,
        requests,
        latestRequest: requests[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all host requests (Admin only)
 */
const getAllHostRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const requests = await ElectionHostRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'voterId', 'role', 'hostPermissionStatus'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const pendingCount = await ElectionHostRequest.count({ where: { status: 'PENDING' } });
    const approvedCount = await ElectionHostRequest.count({ where: { status: 'APPROVED' } });
    const rejectedCount = await ElectionHostRequest.count({ where: { status: 'REJECTED' } });

    res.status(200).json({
      success: true,
      data: {
        requests,
        stats: {
          total: requests.length,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single host request by ID (Admin or Requester)
 */
const getHostRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hostRequest = await ElectionHostRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'voterId', 'role', 'hostPermissionStatus'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!hostRequest) {
      return res.status(404).json({
        success: false,
        error: 'Host request not found',
      });
    }

    // Access control: only admin or the user who created the request can view it
    if (req.user.role !== 'ADMIN' && hostRequest.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this request',
      });
    }

    res.status(200).json({
      success: true,
      data: hostRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a host request (Admin only)
 */
const approveHostRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const hostRequest = await ElectionHostRequest.findByPk(id);

    if (!hostRequest) {
      return res.status(404).json({
        success: false,
        error: 'Host request not found',
      });
    }

    if (hostRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve request with status '${hostRequest.status}'. Only PENDING requests can be approved.`,
      });
    }

    const requester = await User.findByPk(hostRequest.userId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        error: 'Requester user account not found',
      });
    }

    // Update request
    hostRequest.status = 'APPROVED';
    hostRequest.reviewedBy = adminId;
    hostRequest.reviewedAt = new Date();
    await hostRequest.save();

    // Update requester's host permission status
    requester.hostPermissionStatus = 'APPROVED';
    await requester.save();

    AuditService.logHostRequest('HOST_REQUEST_APPROVED', hostRequest, req.user, req);

    res.status(200).json({
      success: true,
      message: `Election host request approved successfully for ${requester.name}`,
      data: {
        request: hostRequest,
        user: {
          id: requester.id,
          name: requester.name,
          email: requester.email,
          hostPermissionStatus: requester.hostPermissionStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a host request (Admin only)
 */
const rejectHostRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminReason } = req.body;
    const adminId = req.user.id;

    const hostRequest = await ElectionHostRequest.findByPk(id);

    if (!hostRequest) {
      return res.status(404).json({
        success: false,
        error: 'Host request not found',
      });
    }

    if (hostRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject request with status '${hostRequest.status}'. Only PENDING requests can be rejected.`,
      });
    }

    const requester = await User.findByPk(hostRequest.userId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        error: 'Requester user account not found',
      });
    }

    // Update request
    hostRequest.status = 'REJECTED';
    hostRequest.adminReason = adminReason || 'The request does not meet the necessary criteria for hosting an election.';
    hostRequest.reviewedBy = adminId;
    hostRequest.reviewedAt = new Date();
    await hostRequest.save();

    // Update requester's host permission status
    requester.hostPermissionStatus = 'REJECTED';
    await requester.save();

    AuditService.logHostRequest('HOST_REQUEST_REJECTED', hostRequest, req.user, req, { adminReason: hostRequest.adminReason });

    res.status(200).json({
      success: true,
      message: `Election host request rejected for ${requester.name}`,
      data: {
        request: hostRequest,
        user: {
          id: requester.id,
          name: requester.name,
          email: requester.email,
          hostPermissionStatus: requester.hostPermissionStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitHostRequest,
  getMyHostRequests,
  getAllHostRequests,
  getHostRequestById,
  approveHostRequest,
  rejectHostRequest,
};
