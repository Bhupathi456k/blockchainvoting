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

    const existingPending = await ElectionHostRequest.findOne({
      userId,
      status: 'PENDING',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending host request under review. Please wait for an administrator to review it.',
      });
    }

    const start = new Date(proposedStartDate);
    const end = new Date(proposedEndDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Proposed start date must be before proposed end date',
      });
    }

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

    await User.updateOne({ _id: userId }, { hostPermissionStatus: 'PENDING' });

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

    const requests = await ElectionHostRequest.find({ userId }).sort({ createdAt: -1 });

    const user = await User.findById(userId).select('id hostPermissionStatus');

    res.status(200).json({
      success: true,
      data: {
        hostPermissionStatus: user ? user.hostPermissionStatus : 'NONE',
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
    const query = {};

    if (status) {
      query.status = status;
    }

    const rawRequests = await ElectionHostRequest.find(query).sort({ createdAt: -1 });

    const requests = await Promise.all(
      rawRequests.map(async (r) => {
        const requester = await User.findById(r.userId).select('id name email voterId role hostPermissionStatus');
        const reviewer = r.reviewedBy ? await User.findById(r.reviewedBy).select('id name email') : null;
        const rObj = r.toObject();
        rObj.requester = requester;
        rObj.reviewer = reviewer;
        return rObj;
      })
    );

    const pendingCount = await ElectionHostRequest.countDocuments({ status: 'PENDING' });
    const approvedCount = await ElectionHostRequest.countDocuments({ status: 'APPROVED' });
    const rejectedCount = await ElectionHostRequest.countDocuments({ status: 'REJECTED' });

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
 * Get single host request by ID
 */
const getHostRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hostRequest = await ElectionHostRequest.findById(id);

    if (!hostRequest) {
      return res.status(404).json({
        success: false,
        error: 'Host request not found',
      });
    }

    if (req.user.role !== 'ADMIN' && String(hostRequest.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this request',
      });
    }

    const requester = await User.findById(hostRequest.userId).select('id name email voterId role hostPermissionStatus');
    const reviewer = hostRequest.reviewedBy ? await User.findById(hostRequest.reviewedBy).select('id name email') : null;

    const reqObj = hostRequest.toObject();
    reqObj.requester = requester;
    reqObj.reviewer = reviewer;

    res.status(200).json({
      success: true,
      data: reqObj,
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

    const hostRequest = await ElectionHostRequest.findById(id);

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

    const requester = await User.findById(hostRequest.userId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        error: 'Requester user account not found',
      });
    }

    hostRequest.status = 'APPROVED';
    hostRequest.reviewedBy = adminId;
    hostRequest.reviewedAt = new Date();
    await hostRequest.save();

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

    const hostRequest = await ElectionHostRequest.findById(id);

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

    const requester = await User.findById(hostRequest.userId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        error: 'Requester user account not found',
      });
    }

    hostRequest.status = 'REJECTED';
    hostRequest.adminReason = adminReason || 'The request does not meet the necessary criteria for hosting an election.';
    hostRequest.reviewedBy = adminId;
    hostRequest.reviewedAt = new Date();
    await hostRequest.save();

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
