const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  voterId: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('VOTER', 'ADMIN'),
    defaultValue: 'VOTER',
    allowNull: false,
  },
  walletAddress: {
    type: DataTypes.STRING(42),
    allowNull: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i,
    },
  },
  isEligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  hasVoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['voterId'] },
    { fields: ['walletAddress'] },
  ],
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
User.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

module.exports = User;
