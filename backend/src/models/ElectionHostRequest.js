const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ElectionHostRequest = sequelize.define('ElectionHostRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  electionTitle: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  electionDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expectedVoters: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  proposedStartDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  proposedEndDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  electionType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  additionalInformation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  adminReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'election_host_requests',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = ElectionHostRequest;
