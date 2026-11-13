const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Ensure process.versions.node exists for MongoDB driver metadata in Jest environments
if (!process.versions) {
  process.versions = { node: process.version || '20.0.0' };
} else if (!process.versions.node) {
  process.versions.node = process.version || '20.0.0';
}

const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (isConnecting) {
    while (mongoose.connection.readyState !== 1 && isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  isConnecting = true;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blockchain_voting';
    await mongoose.connect(mongoUri, {
      directConnection: true,
      serverSelectionTimeoutMS: 5000,
      driverInfo: { name: 'nodejs', version: process.version || 'v20.0.0' },
      runtimeAdapters: { os: require('os') },
    });
    console.log('✓ Database connection established successfully (MongoDB)');
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
};

const sequelize = {
  authenticate: connectDB,
  sync: async () => {
    await connectDB();
    return true;
  },
  close: async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  },
};

module.exports = {
  mongoose,
  sequelize,
  testConnection: connectDB,
  connectDB,
};
