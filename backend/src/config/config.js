require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./database.sqlite',
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
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
    email: process.env.ADMIN_EMAIL || 'admin@voting.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    name: 'System Administrator',
    voterId: 'ADMIN001',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
};
