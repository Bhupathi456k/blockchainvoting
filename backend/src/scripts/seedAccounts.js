const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sequelize, User, ElectionHostRequest, Election, Candidate } = require('../models');
const config = require('../config/config');

/**
 * Seed Accounts Script
 * Idempotently creates or updates the development admin and demo user accounts.
 */
const ACCOUNTS = [
  {
    voterId: 'admin',
    name: 'BlockVote Administrator',
    email: 'admin@blockvote.local',
    password: process.env.ADMIN_PASSWORD || 'Admin#BV2026!SecP@ss',
    role: 'ADMIN',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'voter1',
    name: 'Demo Voter One',
    email: 'voter1@blockvote.local',
    password: process.env.DEMO_VOTER1_PASSWORD || 'Voter1#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'voter2',
    name: 'Demo Voter Two',
    email: 'voter2@blockvote.local',
    password: process.env.DEMO_VOTER2_PASSWORD || 'Voter2#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'voter3',
    name: 'Demo Voter Three',
    email: 'voter3@blockvote.local',
    password: process.env.DEMO_VOTER3_PASSWORD || 'Voter3#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'voter4',
    name: 'Demo Voter Four',
    email: 'voter4@blockvote.local',
    password: process.env.DEMO_VOTER4_PASSWORD || 'Voter4#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'voter5',
    name: 'Demo Voter Five',
    email: 'voter5@blockvote.local',
    password: process.env.DEMO_VOTER5_PASSWORD || 'Voter5#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'NONE',
    isEligible: true,
  },
  {
    voterId: 'host',
    name: 'Demo Election Host',
    email: 'host@blockvote.local',
    password: process.env.DEMO_HOST_PASSWORD || 'Host#Pass2026!bv',
    role: 'VOTER',
    hostPermissionStatus: 'APPROVED',
    isEligible: true,
  },
];

const seedAccounts = async () => {
  try {
    console.log('🌱 Seeding BlockVote Demo Accounts');
    console.log('===================================');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await sequelize.sync();
    console.log('✓ Database schema synchronized');

    for (const acc of ACCOUNTS) {
      const existing = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: acc.email },
            { voterId: acc.voterId },
          ],
        },
      });

      const passwordHash = await User.hashPassword(acc.password);

      if (existing) {
        // Update credentials and role if needed (idempotent repair)
        existing.name = acc.name;
        existing.role = acc.role;
        existing.hostPermissionStatus = acc.hostPermissionStatus;
        existing.isEligible = acc.isEligible;
        existing.passwordHash = passwordHash;
        await existing.save();
        console.log(`✓ Updated existing account: ${acc.email} (${acc.role}, status: ${acc.hostPermissionStatus})`);
      } else {
        await User.create({
          voterId: acc.voterId,
          name: acc.name,
          email: acc.email,
          passwordHash: passwordHash,
          role: acc.role,
          hostPermissionStatus: acc.hostPermissionStatus,
          isEligible: acc.isEligible,
          hasVoted: false,
        });
        console.log(`✓ Created new account: ${acc.email} (${acc.role}, status: ${acc.hostPermissionStatus})`);
      }
    }

    console.log('===================================');
    console.log('✅ All demo accounts seeded successfully!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedAccounts();
}

module.exports = { seedAccounts, ACCOUNTS };
