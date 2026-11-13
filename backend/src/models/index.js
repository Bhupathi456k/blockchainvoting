const { sequelize, connectDB, mongoose } = require('../config/database');
const User = require('./User');
const Election = require('./Election');
const Candidate = require('./Candidate');
const BlockchainTransaction = require('./BlockchainTransaction');
const ElectionHostRequest = require('./ElectionHostRequest');
const AuditLog = require('./AuditLog');
const WebAuthnCredential = require('./WebAuthnCredential');

const initDatabase = async () => {
  try {
    await connectDB();
    console.log('✓ MongoDB models initialized');
    const { seedAccounts } = require('../scripts/seedAccounts');
    await seedAccounts();
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
  mongoose,
  User,
  Election,
  Candidate,
  BlockchainTransaction,
  ElectionHostRequest,
  AuditLog,
  WebAuthnCredential,
  initDatabase,
};
