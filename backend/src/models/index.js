const { sequelize } = require('../config/database');
const User = require('./User');
const Election = require('./Election');
const Candidate = require('./Candidate');
const BlockchainTransaction = require('./BlockchainTransaction');

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

// Initialize database
const initDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synchronized');

    // Create admin user if doesn't exist
    const config = require('../config/config');
    const adminExists = await User.findOne({ where: { email: config.admin.email } });

    if (!adminExists) {
      const passwordHash = await User.hashPassword(config.admin.password);
      await User.create({
        voterId: config.admin.voterId,
        name: config.admin.name,
        email: config.admin.email,
        passwordHash: passwordHash,
        role: 'ADMIN',
        isEligible: true,
      });
      console.log('✓ Admin user created');
    }
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
  initDatabase,
};
