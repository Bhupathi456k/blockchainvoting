const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Election = sequelize.define('Election', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED'),
    defaultValue: 'DRAFT',
    allowNull: false,
  },
  contractElectionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isDeployedToBlockchain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'elections',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['startTime'] },
    { fields: ['endTime'] },
  ],
});

module.exports = Election;
