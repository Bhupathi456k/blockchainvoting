const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const request = require('supertest');
const app = require('../app');
const { sequelize, User, Election, Candidate } = require('../models');
const { ACCOUNTS } = require('./seedAccounts');

async function runVerification() {
  console.log('============================================================');
  console.log('       BLOCKVOTE AUTHENTICATION & DEMO ACCOUNTS AUDIT       ');
  console.log('============================================================\n');

  let allPassed = true;
  const results = {};

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${details}`);
      results[name] = 'PASS';
    } else {
      console.error(`  ❌ FAIL: ${name} ${details}`);
      results[name] = 'FAIL';
      allPassed = false;
    }
  };

  try {
    // -------------------------------------------------------------
    // 1. DATABASE INTEGRITY CHECK
    // -------------------------------------------------------------
    console.log('--- 1. DATABASE INTEGRITY INSPECTION ---');
    await sequelize.authenticate();
    const usersInDb = await User.findAll();

    assert('Database Connection', true, `(${usersInDb.length} users in DB)`);

    for (const acc of ACCOUNTS) {
      const u = usersInDb.find((item) => item.email === acc.email);
      assert(`User Exists in DB: ${acc.email}`, !!u);
      if (u) {
        assert(
          `Password Hash Valid (bcrypt $2a$): ${acc.email}`,
          u.passwordHash && u.passwordHash.startsWith('$2a$') && u.passwordHash.length === 60
        );
        assert(`Role Matches (${acc.role}): ${acc.email}`, u.role === acc.role);
        assert(
          `Host Permission Matches (${acc.hostPermissionStatus}): ${acc.email}`,
          u.hostPermissionStatus === acc.hostPermissionStatus
        );
      }
    }

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & LOGIN TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION LOGIN VERIFICATION ---');
    const tokens = {};

    for (const acc of ACCOUNTS) {
      // Test login with email
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: acc.email, password: acc.password });

      assert(
        `Login with Email: ${acc.email}`,
        res.status === 200 && res.body.success === true && !!res.body.data.token,
        `Status ${res.status}`
      );

      if (res.body?.data?.token) {
        tokens[acc.voterId] = res.body.data.token;
        assert(
          `Token Profile No Password Hash: ${acc.email}`,
          res.body.data.user.passwordHash === undefined
        );
        assert(
          `Token Profile Role: ${acc.email}`,
          res.body.data.user.role === acc.role
        );
        assert(
          `Token Profile Host Status: ${acc.email}`,
          res.body.data.user.hostPermissionStatus === acc.hostPermissionStatus
        );
      }

      // Test login with voterId
      const resVoterId = await request(app)
        .post('/api/auth/login')
        .send({ identifier: acc.voterId, password: acc.password });

      assert(
        `Login with Voter ID: ${acc.voterId}`,
        resVoterId.status === 200 && resVoterId.body.success === true
      );
    }

    // -------------------------------------------------------------
    // 3. NEGATIVE LOGIN TESTS (WRONG CREDENTIALS)
    // -------------------------------------------------------------
    console.log('\n--- 3. NEGATIVE LOGIN & SECURITY TESTS ---');

    // Wrong password for admin
    const wrongAdminRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@blockvote.local', password: 'WrongPassword999!' });
    assert(
      'Admin Wrong Password Rejected',
      wrongAdminRes.status === 401 && wrongAdminRes.body.success === false,
      `Status ${wrongAdminRes.status}`
    );

    // Wrong password for voter1
    const wrongVoterRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'voter1@blockvote.local', password: 'WrongPassword999!' });
    assert(
      'Voter Wrong Password Rejected',
      wrongVoterRes.status === 401 && wrongVoterRes.body.success === false,
      `Status ${wrongVoterRes.status}`
    );

    // Non-existent user
    const unknownRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'ghost@blockvote.local', password: 'AnyPassword123!' });
    assert(
      'Unknown User Login Rejected',
      unknownRes.status === 401 && unknownRes.body.success === false,
      `Status ${unknownRes.status}`
    );

    // Empty credentials
    const emptyRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '', password: '' });
    assert(
      'Empty Credentials Rejected',
      emptyRes.status === 400 && emptyRes.body.success === false,
      `Status ${emptyRes.status}`
    );

    // -------------------------------------------------------------
    // 4. CURRENT PROFILE ENDPOINT (/api/auth/me)
    // -------------------------------------------------------------
    console.log('\n--- 4. AUTH PROFILE ENDPOINT (/api/auth/me) ---');

    for (const acc of ACCOUNTS) {
      const token = tokens[acc.voterId];
      if (token) {
        const meRes = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        assert(
          `GET /api/auth/me for ${acc.email}`,
          meRes.status === 200 &&
            meRes.body.data.user.email === acc.email &&
            meRes.body.data.user.role === acc.role &&
            meRes.body.data.user.hostPermissionStatus === acc.hostPermissionStatus &&
            meRes.body.data.user.passwordHash === undefined
        );
      }
    }

    // -------------------------------------------------------------
    // 5. ROLE-BASED AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- 5. ROLE & ROUTE AUTHORIZATION ENFORCEMENT ---');

    // Admin Stats Endpoint (/api/voters/stats - requires ADMIN)
    const adminStatsRes = await request(app)
      .get('/api/voters/stats')
      .set('Authorization', `Bearer ${tokens['admin']}`);
    assert(
      'Admin Access to Admin Stats API',
      adminStatsRes.status === 200 && adminStatsRes.body.success === true,
      `Status ${adminStatsRes.status}`
    );

    const voter1StatsRes = await request(app)
      .get('/api/voters/stats')
      .set('Authorization', `Bearer ${tokens['voter1']}`);
    assert(
      'Voter 1 Denied Admin Stats API (403)',
      voter1StatsRes.status === 403,
      `Status ${voter1StatsRes.status}`
    );

    const hostStatsRes = await request(app)
      .get('/api/voters/stats')
      .set('Authorization', `Bearer ${tokens['host']}`);
    assert(
      'Approved Host Denied Admin Stats API (403)',
      hostStatsRes.status === 403,
      `Status ${hostStatsRes.status}`
    );

    // Admin Host Requests List (/api/host-requests - requires ADMIN)
    const adminHostReqRes = await request(app)
      .get('/api/host-requests')
      .set('Authorization', `Bearer ${tokens['admin']}`);
    assert(
      'Admin Access to Host Requests List',
      adminHostReqRes.status === 200,
      `Status ${adminHostReqRes.status}`
    );

    const voterHostReqRes = await request(app)
      .get('/api/host-requests')
      .set('Authorization', `Bearer ${tokens['voter1']}`);
    assert(
      'Voter 1 Denied Host Requests Review (403)',
      voterHostReqRes.status === 403,
      `Status ${voterHostReqRes.status}`
    );

    // -------------------------------------------------------------
    // 6. ELECTION HOSTING & OWNERSHIP ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- 6. ELECTION HOSTING & CREATION WORKFLOW ---');

    // Approved Host creates election -> ALLOWED (201)
    const hostElectionRes = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${tokens['host']}`)
      .send({
        title: 'Demo Host Community Election 2026',
        description: 'Election created by approved demo host',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
      });

    assert(
      'Approved Host Creates Election (201)',
      hostElectionRes.status === 201 && hostElectionRes.body.success === true,
      `Status ${hostElectionRes.status}`
    );

    const electionId = hostElectionRes.body?.data?.id;

    // Normal Voter (hostPermissionStatus: NONE) tries to create election -> DENIED (403)
    const voterCreateElectionRes = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${tokens['voter1']}`)
      .send({
        title: 'Unauthorized Voter Election',
        description: 'Should fail with 403',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
      });

    assert(
      'Normal Voter Denied Election Creation (403)',
      voterCreateElectionRes.status === 403 &&
        voterCreateElectionRes.body.error.includes('permission'),
      `Status ${voterCreateElectionRes.status}`
    );

    // Approved Host adds candidate to their election -> ALLOWED (201)
    if (electionId) {
      const addCandRes = await request(app)
        .post(`/api/candidates/${electionId}`)
        .set('Authorization', `Bearer ${tokens['host']}`)
        .send({
          name: 'Demo Candidate 1',
          party: 'Civic Innovators',
          description: 'Platform of transparency and open governance',
        });

      assert(
        'Approved Host Adds Candidate to Owned Election (201)',
        addCandRes.status === 201 && addCandRes.body.success === true,
        `Status ${addCandRes.status}`
      );

      // Normal Voter tries to add candidate to Host's election -> DENIED (403)
      const unauthorizedCandRes = await request(app)
        .post(`/api/candidates/${electionId}`)
        .set('Authorization', `Bearer ${tokens['voter1']}`)
        .send({
          name: 'Intruder Candidate',
          party: 'Unauthorized Party',
        });

      assert(
        'Normal Voter Denied Candidate Addition on Other Election (403)',
        unauthorizedCandRes.status === 403,
        `Status ${unauthorizedCandRes.status}`
      );
    }

    console.log('\n============================================================');
    if (allPassed) {
      console.log(' 🎉 ALL AUDIT & AUTHENTICATION TESTS PASSED SUCCESSFULLY! ');
    } else {
      console.error(' ❌ SOME TESTS FAILED! CHECK OUTPUT ABOVE. ');
    }
    console.log('============================================================\n');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Fatal Verification Error:', error);
    process.exit(1);
  }
}

runVerification();
