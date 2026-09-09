require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');
const config = require('../config/config');

async function runTests() {
  console.log('🧪 Starting Admin Authentication & Authorization Test Suite');
  console.log('============================================================');

  let passed = 0;
  let failed = 0;

  function report(name, isPass, details = '') {
    if (isPass) {
      console.log(`✅ [PASS] ${name} ${details}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  try {
    await sequelize.authenticate();

    // 1. Create / Verify Admin exists
    const adminEmail = config.admin.email;
    const adminPassword = config.admin.password;
    const adminVoterId = config.admin.voterId;

    // 2. Create a test voter
    const voterEmail = 'testvoter_' + Date.now() + '@example.com';
    const voterVoterId = 'VOTER_' + Date.now();
    const voterPassword = 'VoterPassword123!';
    const voterPasswordHash = await User.hashPassword(voterPassword);

    const testVoter = await User.create({
      name: 'Test Regular Voter',
      email: voterEmail,
      voterId: voterVoterId,
      passwordHash: voterPasswordHash,
      role: 'VOTER',
      isEligible: true,
    });

    console.log(`\nCreated test voter: ${voterEmail} (role: VOTER)`);

    // TEST 1A: Login with correct admin email
    console.log('\n--- TEST 1A: Admin Login via Email ---');
    const res1A = await request(app)
      .post('/api/auth/login')
      .send({ identifier: adminEmail, password: adminPassword });

    const test1APass = res1A.status === 200 &&
      res1A.body.success === true &&
      res1A.body.data.user.role === 'ADMIN' &&
      !!res1A.body.data.token;
    report('Admin Login with correct email & password', test1APass, `(Status: ${res1A.status}, Role: ${res1A.body?.data?.user?.role})`);
    const adminToken = res1A.body?.data?.token;

    // TEST 1B: Login with correct admin voterId/username
    console.log('\n--- TEST 1B: Admin Login via VoterId / Username ---');
    const res1B = await request(app)
      .post('/api/auth/login')
      .send({ identifier: adminVoterId, password: adminPassword });

    const test1BPass = res1B.status === 200 &&
      res1B.body.success === true &&
      res1B.body.data.user.role === 'ADMIN';
    report('Admin Login with correct username (voterId) & password', test1BPass, `(Status: ${res1B.status})`);

    // TEST 2: Login with incorrect admin password
    console.log('\n--- TEST 2: Login with Incorrect Password ---');
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ identifier: adminEmail, password: 'WrongPassword123!' });

    const test2Pass = res2.status === 401 && res2.body.success === false;
    report('Admin Login with incorrect password rejected', test2Pass, `(Status: ${res2.status}, Error: "${res2.body.error}")`);

    // TEST 3: Access admin API without token
    console.log('\n--- TEST 3: Access Admin API Without Authentication ---');
    const res3 = await request(app)
      .get('/api/voters/stats');

    const test3Pass = res3.status === 401 && res3.body.success === false;
    report('Access admin route without token rejected with 401', test3Pass, `(Status: ${res3.status})`);

    // Login as voter to get voter token
    const resVoterLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: voterEmail, password: voterPassword });
    const voterToken = resVoterLogin.body?.data?.token;

    // TEST 4A: Voter accessing /api/voters/stats (Admin only)
    console.log('\n--- TEST 4A: Voter Accessing Admin Stats API ---');
    const res4A = await request(app)
      .get('/api/voters/stats')
      .set('Authorization', `Bearer ${voterToken}`);

    const test4APass = res4A.status === 403 && res4A.body.success === false;
    report('Voter attempting GET /api/voters/stats rejected with 403 Forbidden', test4APass, `(Status: ${res4A.status}, Error: "${res4A.body.error}")`);

    // TEST 4B: Voter attempting to create an election
    console.log('\n--- TEST 4B: Voter Accessing Create Election API ---');
    const res4B = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({
        title: 'Unauthorized Election',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
      });

    const test4BPass = res4B.status === 403 && res4B.body.success === false;
    report('Voter attempting POST /api/elections rejected with 403 Forbidden', test4BPass, `(Status: ${res4B.status})`);

    // TEST 4C: Admin accessing /api/voters/stats (Allowed)
    console.log('\n--- TEST 4C: Admin Accessing Admin Stats API ---');
    const res4C = await request(app)
      .get('/api/voters/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    const test4CPass = res4C.status === 200 && res4C.body.success === true;
    report('Admin accessing GET /api/voters/stats permitted with 200 OK', test4CPass, `(Status: ${res4C.status})`);

    // Cleanup test voter
    await testVoter.destroy();
    console.log('\nCleaned up test voter.');

    // Summary
    console.log('\n============================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
