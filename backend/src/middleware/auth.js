const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please authenticate.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please login again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please authenticate.',
      });
    }

    // Reject temporary pre-auth tokens on full-access routes
    if (decoded.type === 'pre-auth') {
      return res.status(401).json({
        success: false,
        error: 'Biometric verification is required. Please complete biometric authentication.',
        code: 'BIOMETRIC_REQUIRED',
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please authenticate.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Require approved election host permission
 * Checks if user has APPROVED hostPermissionStatus
 */
const requireApprovedElectionHost = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  if (req.user.role !== 'VOTER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid user role',
    });
  }

  // Admins can always create elections
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // For voters, check host permission
  if (req.user.hostPermissionStatus !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to host an election. Please request permission from an administrator.',
    });
  }

  next();
};

/**
 * Require election ownership or admin
 * Checks if user owns the election or is admin
 */
const requireElectionOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Admin can manage all elections
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const { Election } = require('../models');
    const electionId = req.params.id || req.params.electionId;

    if (!electionId) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }

    const election = await Election.findByPk(electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    // Check ownership
    const hostIdStr = String(election.hostUserId || '');
    const userIdStr = String(req.user.id || req.user._id || '');
    if (hostIdStr !== userIdStr) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this election',
      });
    }

    next();
  } catch (error) {
    console.error('Election ownership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization check failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] },
      });

      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Authentication middleware that accepts BOTH full tokens and temporary pre-auth tokens.
 * Used exclusively for WebAuthn setup/registration endpoints during initial login.
 */
const authenticatePreAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please authenticate.',
      });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid session token. Please log in again.',
      });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found.',
      });
    }

    req.user = user;
    req.isPreAuth = decoded.type === 'pre-auth';
    next();
  } catch (error) {
    console.error('Pre-auth authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

module.exports = {
  authenticate,
  authenticatePreAuth,
  authorize,
  optionalAuth,
  requireApprovedElectionHost,
  requireElectionOwner,
};
