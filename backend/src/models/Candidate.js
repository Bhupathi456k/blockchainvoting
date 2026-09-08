const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Candidate = sequelize.define('Candidate', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  party: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  blockchainCandidateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isDeployedToBlockchain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'candidates',
  timestamps: true,
  indexes: [
    { fields: ['electionId'] },
    { fields: ['blockchainCandidateId'] },
  ],
});

module.exports = Candidate;
