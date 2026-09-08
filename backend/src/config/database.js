const { Sequelize } = require('sequelize');
const config = require('./config');

// Create Sequelize instance
const sequelize = new Sequelize(config.database.url, {
  dialect: config.database.dialect,
  storage: config.database.storage,
  logging: config.database.logging,
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
