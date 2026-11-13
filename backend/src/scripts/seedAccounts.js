const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { connectDB, User } = require('../models');

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
    console.log('🌱 Seeding BlockVote Demo Accounts into MongoDB');
    console.log('===================================');

    await connectDB();
    console.log('✓ MongoDB connection established');

    for (const acc of ACCOUNTS) {
      const passwordHash = await User.hashPassword(acc.password);
      await User.updateOne(
        { email: acc.email.toLowerCase() },
        {
          $set: {
            voterId: acc.voterId,
            name: acc.name,
            email: acc.email.toLowerCase(),
            passwordHash: passwordHash,
            role: acc.role,
            hostPermissionStatus: acc.hostPermissionStatus,
            isEligible: acc.isEligible,
          },
          $setOnInsert: {
            hasVoted: false,
          },
        },
        { upsert: true }
      );
      console.log(`✓ Seeded account: ${acc.email} (${acc.role}, status: ${acc.hostPermissionStatus})`);
    }

    console.log('===================================');
    console.log('✅ All demo accounts seeded successfully in MongoDB!');
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
