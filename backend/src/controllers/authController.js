const jwt = require('jsonwebtoken');
const { User, BlockchainTransaction } = require('../models');
const config = require('../config/config');
const blockchainService = require('../services/blockchainService');

/**
 * Register a new voter
 */
const register = async (req, res, next) => {
  try {
    const { voterId, name, email, phone, password, walletAddress } = req.body;

    // Check if voterId or email already exists
    const existingVoterId = await User.findOne({ where: { voterId } });
    if (existingVoterId) {
      return res.status(409).json({
        success: false,
        error: 'A voter with this Voter ID is already registered',
      });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'A voter with this email address is already registered',
      });
    }

    // Check wallet address uniqueness if provided
    if (walletAddress) {
      const existingWallet = await User.findOne({ where: { walletAddress } });
      if (existingWallet) {
        return res.status(409).json({
          success: false,
          error: 'This wallet address is already linked to another account',
        });
      }
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      voterId,
      name,
      email,
      phone,
      passwordHash,
      role: 'VOTER',
      walletAddress: walletAddress || null,
      isEligible: true,
      hasVoted: false,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          voterId: user.voterId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletAddress: user.walletAddress,
          isEligible: user.isEligible,
          hasVoted: user.hasVoted,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user (voter or admin)
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or voterId

    // Find user by email or voterId
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: identifier },
          { voterId: identifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password incorrect.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Sync on-chain voting status if wallet is attached
    let blockchainHasVoted = user.hasVoted;
    if (user.walletAddress && blockchainService.contract) {
      try {
        blockchainHasVoted = await blockchainService.checkHasVoted(user.walletAddress);
        if (blockchainHasVoted !== user.hasVoted) {
          user.hasVoted = blockchainHasVoted;
          await user.save();
        }
      } catch (e) {
        // Log silently
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          voterId: user.voterId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletAddress: user.walletAddress,
          isEligible: user.isEligible,
          hasVoted: user.hasVoted,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Check blockchain voting status if wallet is attached
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
        user: {
          id: user.id,
          voterId: user.voterId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletAddress: user.walletAddress,
          isEligible: user.isEligible,
          hasVoted: user.hasVoted,
        },
        blockchain: blockchainStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wallet address for current user
 */
const updateWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const user = req.user;

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum wallet address format',
      });
    }

    // Check if wallet is already used by another user
    const existingWallet = await User.findOne({
      where: {
        walletAddress,
        id: { [require('sequelize').Op.ne]: user.id },
      },
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
      data: {
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateWallet,
  logout,
};
