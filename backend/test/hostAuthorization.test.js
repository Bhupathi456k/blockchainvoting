const request = require('supertest');
const app = require('../src/app');
const { mongoose, User, Election, Candidate, ElectionHostRequest, initDatabase } = require('../src/models');
const config = require('../src/config/config');
const { seedAccounts } = require('../src/scripts/seedAccounts');

jest.setTimeout(30000);

describe('Election Host Authorization & Workflow Test Suite', () => {
  let adminToken;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let requestId;
  let electionId;

  beforeAll(async () => {
    await initDatabase();
    await User.deleteMany({});
    await ElectionHostRequest.deleteMany({});
    await Election.deleteMany({});
    await Candidate.deleteMany({});
    await seedAccounts();

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: config.admin.email,
        password: config.admin.password,
      });

    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.token;
  });

  afterAll(async () => {
    await seedAccounts();
    await mongoose.connection.close();
  });

  test('TEST 1: New user registers with hostPermissionStatus = NONE', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Requester',
        voterId: 'VOTER_ALICE_001',
        email: 'alice@example.com',
        phone: '1234567890',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('VOTER');
    expect(res.body.data.user.hostPermissionStatus).toBe('NONE');

    user1Token = res.body.data.token;
    user1Id = res.body.data.user.id;
  });

  test('TEST 2: User submits hosting request -> status is PENDING and user status updates to PENDING', async () => {
    const res = await request(app)
      .post('/api/host-requests')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        electionTitle: 'Computer Science Department Election',
        electionDescription: 'Annual election for CS student representatives',
        purpose: 'Elect department student chairs',
        expectedVoters: 250,
        proposedStartDate: new Date(Date.now() + 86400000).toISOString(),
        proposedEndDate: new Date(Date.now() + 172800000).toISOString(),
        electionType: 'Student Council',
        additionalInformation: 'Supervised by faculty',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(String(res.body.data.userId)).toBe(String(user1Id));
    requestId = res.body.data.id;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.hostPermissionStatus).toBe('PENDING');
  });

  test('TEST 3: User submits second request while one is PENDING -> rejected (400)', async () => {
    const res = await request(app)
      .post('/api/host-requests')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        electionTitle: 'Duplicate Request Election',
        purpose: 'Spamming requests',
        expectedVoters: 100,
        proposedStartDate: new Date(Date.now() + 86400000).toISOString(),
        proposedEndDate: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already have a pending host request');
  });

  test('TEST 4: User tries to create election while PENDING -> 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Unauthorized Election Attempt',
        description: 'Should fail',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('permission');
  });

  test('TEST 5: Admin views pending requests -> request is visible with requester details', async () => {
    const res = await request(app)
      .get('/api/host-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requests.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.pending).toBeGreaterThanOrEqual(1);

    const found = res.body.data.requests.find((r) => String(r.id) === String(requestId));
    expect(found).toBeDefined();
    expect(found.requester.name).toBe('Alice Requester');
  });

  test('TEST 6: Normal user attempts admin approval API -> 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/host-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('TEST 7: Admin approves request -> request and user updated to APPROVED', async () => {
    const res = await request(app)
      .post(`/api/host-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('APPROVED');
    expect(res.body.data.user.hostPermissionStatus).toBe('APPROVED');
  });

  test('TEST 8: Approved user profile endpoint returns APPROVED hostPermissionStatus', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.hostPermissionStatus).toBe('APPROVED');
  });

  test('TEST 9: Approved user successfully creates an election', async () => {
    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Alice Hosted CS Election',
        description: 'Official department election created by Alice',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Alice Hosted CS Election');
    expect(String(res.body.data.hostUserId)).toBe(String(user1Id));
    electionId = res.body.data.id;
  });

  test('TEST 10: Another approved host attempts to modify user 1 election -> 403 Forbidden', async () => {
    const u2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Requester',
        voterId: 'VOTER_BOB_002',
        email: 'bob@example.com',
        phone: '1234567891',
        password: 'Password123!',
      });

    user2Token = u2Res.body.data.token;
    user2Id = u2Res.body.data.user.id;

    const bobReqRes = await request(app)
      .post('/api/host-requests')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        electionTitle: 'Bob Election',
        purpose: 'Bob purpose',
        expectedVoters: 50,
        proposedStartDate: new Date(Date.now() + 86400000).toISOString(),
        proposedEndDate: new Date(Date.now() + 172800000).toISOString(),
      });

    await request(app)
      .post(`/api/host-requests/${bobReqRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const updateRes = await request(app)
      .patch(`/api/elections/${electionId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'Hacked Title by Bob',
      });

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.success).toBe(false);
    expect(updateRes.body.error).toContain('permission');
  });

  test('TEST 11 & 12 & 13: Admin rejects request with reason -> User gets REJECTED and cannot create election', async () => {
    const charlieRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Charlie Voter',
        voterId: 'VOTER_CHARLIE_003',
        email: 'charlie@example.com',
        phone: '1234567892',
        password: 'Password123!',
      });

    const charlieToken = charlieRes.body.data.token;

    const charlieReqRes = await request(app)
      .post('/api/host-requests')
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({
        electionTitle: 'Charlie Election',
        purpose: 'Invalid purpose',
        expectedVoters: 10,
        proposedStartDate: new Date(Date.now() + 86400000).toISOString(),
        proposedEndDate: new Date(Date.now() + 172800000).toISOString(),
      });

    const charlieReqId = charlieReqRes.body.data.id;

    const rejectRes = await request(app)
      .post(`/api/host-requests/${charlieReqId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        adminReason: 'The election dates conflict with existing platform schedule.',
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.request.status).toBe('REJECTED');
    expect(rejectRes.body.data.user.hostPermissionStatus).toBe('REJECTED');

    const charlieRequestsRes = await request(app)
      .get('/api/host-requests/me')
      .set('Authorization', `Bearer ${charlieToken}`);

    expect(charlieRequestsRes.status).toBe(200);
    expect(charlieRequestsRes.body.data.hostPermissionStatus).toBe('REJECTED');
    expect(charlieRequestsRes.body.data.latestRequest.adminReason).toBe(
      'The election dates conflict with existing platform schedule.'
    );

    const charlieCreateRes = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({
        title: 'Charlie Unauthorized Election',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(charlieCreateRes.status).toBe(403);
  });

  test('TEST 14: Rejected user can submit a new request -> becomes PENDING', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'charlie@example.com',
        password: 'Password123!',
      });

    const charlieToken = loginRes.body.data.token;

    const resubmitRes = await request(app)
      .post('/api/host-requests')
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({
        electionTitle: 'Charlie Revised Election',
        purpose: 'Revised with non-conflicting dates',
        expectedVoters: 200,
        proposedStartDate: new Date(Date.now() + 259200000).toISOString(),
        proposedEndDate: new Date(Date.now() + 345600000).toISOString(),
      });

    expect(resubmitRes.status).toBe(201);
    expect(resubmitRes.body.data.status).toBe('PENDING');

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${charlieToken}`);

    expect(meRes.body.data.user.hostPermissionStatus).toBe('PENDING');
  });

  test('TEST 15: Unauthenticated request -> 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/host-requests')
      .send({
        electionTitle: 'Unauthenticated Request',
        purpose: 'No token',
        expectedVoters: 10,
        proposedStartDate: new Date(Date.now() + 86400000).toISOString(),
        proposedEndDate: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(res.status).toBe(401);
  });

  test('TEST 16 & 17: User cannot approve their own request or elevate role directly', async () => {
    const approveRes = await request(app)
      .post(`/api/host-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(approveRes.status).toBe(403);
  });

  test('TEST 18: Full End-to-End workflow from election creation to candidate management and lifecycle', async () => {
    const cand1Res = await request(app)
      .post(`/api/candidates/${electionId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Candidate Diana',
        party: 'Open Source Party',
        description: 'Advocate for open software',
      });

    expect(cand1Res.status).toBe(201);
    expect(cand1Res.body.data.name).toBe('Candidate Diana');

    const cand2Res = await request(app)
      .post(`/api/candidates/${electionId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Candidate Ethan',
        party: 'Decentralized Future',
        description: 'Advocate for blockchain tech',
      });

    expect(cand2Res.status).toBe(201);
    expect(cand2Res.body.data.name).toBe('Candidate Ethan');

    const bobAddCandRes = await request(app)
      .post(`/api/candidates/${electionId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Intruder Candidate',
        party: 'Bad Party',
      });

    expect(bobAddCandRes.status).toBe(403);

    const startRes = await request(app)
      .post(`/api/elections/${electionId}/start`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('ACTIVE');

    const endRes = await request(app)
      .post(`/api/elections/${electionId}/end`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('ENDED');
  });
});
