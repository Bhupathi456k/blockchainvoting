const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlockchainTransaction = sequelize.define('BlockchainTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  electionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'elections',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  transactionHash: {
    type: DataTypes.STRING(66),
    allowNull: false,
    unique: true,
  },
  blockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  transactionType: {
    type: DataTypes.ENUM('VOTE', 'ELECTION_CREATE', 'CANDIDATE_ADD', 'VOTER_AUTHORIZE', 'ELECTION_START', 'ELECTION_END'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  gasUsed: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'blockchain_transactions',
  timestamps: true,
  indexes: [
    { fields: ['transactionHash'] },
    { fields: ['electionId'] },
    { fields: ['userId'] },
    { fields: ['transactionType'] },
    { fields: ['status'] },
  ],
});

module.exports = BlockchainTransaction;
