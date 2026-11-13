const path = require('path');

// Ensure environment variables are loaded from backend/.env or root .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const defaultDbStorage = path.resolve(__dirname, '../../database.sqlite');

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || `sqlite:${defaultDbStorage}`,
    dialect: 'sqlite',
    storage: process.env.DATABASE_STORAGE || defaultDbStorage,
    logging: false,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-this-in-production-123',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Blockchain configuration
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    chainId: parseInt(process.env.CHAIN_ID) || 31337,
    contractAddress: process.env.CONTRACT_ADDRESS || '',
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },

  // Admin credentials
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@blockvote.local',
    password: process.env.ADMIN_PASSWORD || 'Admin#BV2026!SecP@ss',
    name: 'BlockVote Administrator',
    voterId: 'admin',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Generous limit for local development/testing
  },

  // WebAuthn / FIDO2 / Passkey configuration
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'BlockVote',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    // Allowed origins — the browser's navigator.credentials check validates against these.
    // In development, both Vite's default port and a possible CRA port are accepted.
    expectedOrigins: (process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    // Challenge lifetime (ms) — short-lived to prevent replay
    challengeTTL: parseInt(process.env.WEBAUTHN_CHALLENGE_TTL) || 5 * 60 * 1000, // 5 minutes
  },
};
