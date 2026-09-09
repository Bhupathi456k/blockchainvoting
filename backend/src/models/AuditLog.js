const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'SYSTEM',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    performedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'SYSTEM',
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
      allowNull: false,
      defaultValue: 'SUCCESS',
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['action'] },
      { fields: ['category'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = AuditLog;
