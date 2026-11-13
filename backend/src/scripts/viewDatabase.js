const mongoose = require('mongoose');
const { connectDB, User, Election, Candidate, AuditLog } = require('../models');

async function viewDatabase() {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('📦 BLOCKVOTE MONGODB DATABASE EXPLORER');
    console.log('URI: mongodb://127.0.0.1:27017/blockchain_voting');
    console.log('======================================================\n');

    // 1. Users Collection
    const users = await User.find({})
      .select('voterId name email role isFaceVerified isFingerprintVerified hasVoted createdAt')
      .sort({ createdAt: 1 });

    console.log(`👤 REGISTERED USERS (${users.length} records):`);
    console.table(
      users.map((u) => ({
        id: u.id,
        voterId: u.voterId,
        name: u.name,
        email: u.email,
        role: u.role,
        isFaceVerified: u.isFaceVerified,
        isFingerprintVerified: u.isFingerprintVerified,
        hasVoted: u.hasVoted,
        createdAt: u.createdAt,
      }))
    );

    // 2. Elections Collection
    const elections = await Election.find({})
      .select('title status startTime endTime')
      .sort({ createdAt: 1 });
    console.log(`\n🗳️  ELECTIONS (${elections.length} records):`);
    console.table(
      elections.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        startTime: e.startTime,
        endTime: e.endTime,
      }))
    );

    // 3. Candidates Collection
    const candidates = await Candidate.find({})
      .select('electionId name party blockchainCandidateId')
      .sort({ createdAt: 1 });
    console.log(`\n👥 CANDIDATES (${candidates.length} records):`);
    console.table(
      candidates.map((c) => ({
        id: c.id,
        electionId: c.electionId,
        name: c.name,
        party: c.party,
        blockchainCandidateId: c.blockchainCandidateId,
      }))
    );

    // 4. Audit Logs (recent 10)
    const auditLogs = await AuditLog.find({})
      .select('action category targetType status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(`\n📜 RECENT AUDIT LOGS (latest ${auditLogs.length}):`);
    console.table(
      auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        category: l.category,
        targetType: l.targetType,
        status: l.status,
        createdAt: l.createdAt,
      }))
    );

    console.log('\n======================================================');
    console.log('✅ Database inspection complete.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Error viewing database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

viewDatabase();
