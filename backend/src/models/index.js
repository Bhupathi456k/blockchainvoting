const { sequelize } = require('../config/database');
const User = require('./User');
const Election = require('./Election');
const Candidate = require('./Candidate');
const BlockchainTransaction = require('./BlockchainTransaction');
const ElectionHostRequest = require('./ElectionHostRequest');
const AuditLog = require('./AuditLog');

// Define associations
Election.hasMany(Candidate, {
  foreignKey: 'electionId',
  as: 'candidates',
  onDelete: 'CASCADE',
});

Candidate.belongsTo(Election, {
  foreignKey: 'electionId',
  as: 'election',
});

Election.hasMany(BlockchainTransaction, {
  foreignKey: 'electionId',
  as: 'transactions',
  onDelete: 'CASCADE',
});

BlockchainTransaction.belongsTo(Election, {
  foreignKey: 'electionId',
  as: 'election',
});

User.hasMany(BlockchainTransaction, {
  foreignKey: 'userId',
  as: 'transactions',
});

BlockchainTransaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Audit Log associations
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Election Host Request associations
User.hasMany(ElectionHostRequest, {
  foreignKey: 'userId',
  as: 'hostRequests',
});

ElectionHostRequest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'requester',
});

ElectionHostRequest.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer',
});

// Election ownership
User.hasMany(Election, {
  foreignKey: 'hostUserId',
  as: 'hostedElections',
});

Election.belongsTo(User, {
  foreignKey: 'hostUserId',
  as: 'host',
});

// Initialize database
const initDatabase = async () => {
  try {
    // Sync all models (safe create if not exists)
    await sequelize.sync();
    console.log('✓ Database models synchronized');

    // Run idempotent account seeder to guarantee admin & demo credentials
    const { seedAccounts } = require('../scripts/seedAccounts');
    await seedAccounts();
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Election,
  Candidate,
  BlockchainTransaction,
  ElectionHostRequest,
  AuditLog,
  initDatabase,
};
