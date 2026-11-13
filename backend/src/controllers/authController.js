const jwt = require('jsonwebtoken');
const { User, WebAuthnCredential, BlockchainTransaction } = require('../models');
const config = require('../config/config');
const blockchainService = require('../services/blockchainService');
const AuditService = require('../services/auditService');

// ────────────────────────────────────────────────────────────────────
// Token helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Issue the final, fully-privileged access JWT.
 */
function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Issue a short-lived pre-authentication token.
 */
function signPreAuthToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, type: 'pre-auth' },
    config.jwt.secret,
    { expiresIn: '10m' }
  );
}

const crypto = require('crypto');

/** Generate a guaranteed unique Voter ID */
async function generateUniqueVoterId() {
  let isUnique = false;
  let voterId = '';
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    voterId = `VTR-${randomHex}`;
    const existing = await User.findOne({ voterId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  return voterId;
}

// Serialize user data safe for client consumption
function serializeUser(user) {
  return {
    id: user.id,
    voterId: user.voterId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hostPermissionStatus: user.hostPermissionStatus,
    walletAddress: user.walletAddress,
    isEligible: user.isEligible,
    hasVoted: user.hasVoted,
    isFaceVerified: user.isFaceVerified,
    isFingerprintVerified: user.isFingerprintVerified,
  };
}

// ────────────────────────────────────────────────────────────────────
// Register a new voter (Direct Registration - Single Step)
// ────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { voterId, name, email, phone, password, walletAddress, faceData, fingerprintData } = req.body;

    let finalVoterId = (voterId || '').trim();
    if (!finalVoterId) {
      finalVoterId = await generateUniqueVoterId();
    } else {
      const existingVoterId = await User.findOne({ voterId: finalVoterId });
      if (existingVoterId) {
        AuditService.logAuth('USER_REGISTER_FAILED', null, req, { reason: 'Duplicate voter ID', voterId: finalVoterId }, 'FAILURE');
        return res.status(409).json({
          success: false,
          error: 'A voter with this Voter ID is already registered',
        });
      }
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      AuditService.logAuth('USER_REGISTER_FAILED', null, req, { reason: 'Duplicate email', email }, 'FAILURE');
      return res.status(409).json({
        success: false,
        error: 'A voter with this email address is already registered',
      });
    }

    if (walletAddress) {
      const existingWallet = await User.findOne({ walletAddress });
      if (existingWallet) {
        AuditService.logAuth('USER_REGISTER_FAILED', null, req, { reason: 'Duplicate wallet address', walletAddress }, 'FAILURE');
        return res.status(409).json({
          success: false,
          error: 'This wallet address is already linked to another account',
        });
      }
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      voterId: finalVoterId,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'VOTER',
      walletAddress: walletAddress || null,
      isEligible: true,
      hasVoted: false,
      faceData: faceData || null,
      isFaceVerified: !!faceData,
      fingerprintData: fingerprintData || null,
      isFingerprintVerified: !!fingerprintData,
    });

    AuditService.logAuth('USER_REGISTER', user, req, { voterId: user.voterId, role: user.role });

    const token = signAccessToken(user);
    return res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// Login — Direct Single Step Authentication (2-Step Verification Removed)
// ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const trimmedId = (identifier || '').trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedId.toLowerCase() },
        { voterId: trimmedId },
      ],
    });

    if (!user) {
      AuditService.logAuth('USER_FAILED_LOGIN', null, req, { reason: 'User not found', identifier: trimmedId }, 'FAILURE');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      AuditService.logAuth('USER_FAILED_LOGIN', user, req, { reason: 'Incorrect password' }, 'FAILURE');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password incorrect.',
      });
    }

    // Direct Login for ALL accounts - Issue full access token immediately
    AuditService.logAuth('USER_LOGIN', user, req, { role: user.role, hostPermissionStatus: user.hostPermissionStatus });
    const token = signAccessToken(user);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// Finalize login helper
// ────────────────────────────────────────────────────────────────────
const finalizeLogin = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.walletAddress && blockchainService.contract) {
    try {
      const blockchainHasVoted = await blockchainService.checkHasVoted(user.walletAddress);
      if (blockchainHasVoted !== user.hasVoted) {
        user.hasVoted = blockchainHasVoted;
        await user.save();
      }
    } catch (e) {
      // Non-fatal
    }
  }

  AuditService.logAuth('USER_LOGIN', user, req, { role: user.role, hostPermissionStatus: user.hostPermissionStatus });

  const token = signAccessToken(user);
  return { token, user: serializeUser(user) };
};

// ────────────────────────────────────────────────────────────────────
// Get current authenticated user profile
// ────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    let blockchainStatus = { hasVoted: user.hasVoted, isAuthorized: false };
    if (user.walletAddress && blockchainService.contract) {
      try {
        const hasVoted = await blockchainService.checkHasVoted(user.walletAddress);
        const isAuthorized = await blockchainService.checkIsAuthorized(user.walletAddress);
        blockchainStatus = { hasVoted, isAuthorized };

        if (hasVoted !== user.hasVoted) {
          user.hasVoted = hasVoted;
          await user.save();
        }
      } catch (e) {
        // Contract query failed
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: serializeUser(user),
        blockchain: blockchainStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// Update wallet address
// ────────────────────────────────────────────────────────────────────
const updateWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const user = req.user;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum wallet address format',
      });
    }

    const existingWallet = await User.findOne({
      walletAddress,
      _id: { $ne: user._id || user.id },
    });

    if (existingWallet) {
      return res.status(409).json({
        success: false,
        error: 'This wallet address is already linked to another account',
      });
    }

    user.walletAddress = walletAddress;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wallet address updated successfully',
      data: { walletAddress: user.walletAddress },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Generate a new unique Voter ID
const getGeneratedVoterId = async (req, res, next) => {
  try {
    const voterId = await generateUniqueVoterId();
    return res.status(200).json({
      success: true,
      data: { voterId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  finalizeLogin,
  getMe,
  updateWallet,
  logout,
  getGeneratedVoterId,
};
