const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sequelize, User } = require('../models');
const config = require('../config/config');

/**
 * Seed Admin User Script
 * Creates or updates the development admin user (idempotent).
 */
const seedAdmin = async () => {
  try {
    console.log('🌱 Admin Seed Script');
    console.log('===================');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await sequelize.sync();
    console.log('✓ Database models synchronized');

    const adminExists = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: config.admin.email },
          { voterId: config.admin.voterId },
        ],
      },
    });

    const passwordHash = await User.hashPassword(config.admin.password);

    if (adminExists) {
      console.log('ℹ Admin user already exists, updating credentials...');
      adminExists.name = config.admin.name;
      adminExists.email = config.admin.email;
      adminExists.voterId = config.admin.voterId;
      adminExists.role = 'ADMIN';
      adminExists.passwordHash = passwordHash;
      await adminExists.save();
      console.log('✓ Admin user updated successfully');
    } else {
      console.log('⏳ Creating admin user...');
      await User.create({
        voterId: config.admin.voterId,
        name: config.admin.name,
        email: config.admin.email,
        passwordHash: passwordHash,
        role: 'ADMIN',
        isEligible: true,
        hasVoted: false,
      });
      console.log('✅ Admin user created successfully!');
    }

    console.log('===================');
    console.log('Admin Email:', config.admin.email);
    console.log('Admin Voter ID:', config.admin.voterId);
    console.log('Admin Role: ADMIN');
    console.log('===================');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
