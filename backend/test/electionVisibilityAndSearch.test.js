const request = require('supertest');
const app = require('../src/app');
const { mongoose, User, Election, Candidate, initDatabase } = require('../src/models');
const { seedAccounts } = require('../src/scripts/seedAccounts');

jest.setTimeout(30000);

describe('Election Visibility, Ownership & Search Architecture Test Suite', () => {
  let adminToken;
  let adminUser;
  let voter1Token;
  let voter1User;
  let voter2Token;
  let voter2User;
  let hostToken;
  let hostUser;

  let publicUpcomingId;
  let publicActiveId;
  let publicEndedId;
  let privateElectionId;
  let hostElectionId;

  beforeAll(async () => {
    await initDatabase();
    await User.deleteMany({});
    await Election.deleteMany({});
    await Candidate.deleteMany({});
    await seedAccounts();

    // Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@blockvote.local',
        password: process.env.ADMIN_PASSWORD || 'Admin#BV2026!SecP@ss',
      });
    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;

    // Login as Voter 1
    const voter1Res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'voter1@blockvote.local',
        password: process.env.DEMO_VOTER1_PASSWORD || 'Voter1#Pass2026!bv',
      });
    voter1Token = voter1Res.body.data.token;
    voter1User = voter1Res.body.data.user;

    // Login as Voter 2
    const voter2Res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'voter2@blockvote.local',
        password: process.env.DEMO_VOTER2_PASSWORD || 'Voter2#Pass2026!bv',
      });
    voter2Token = voter2Res.body.data.token;
    voter2User = voter2Res.body.data.user;

    // Login as Host
    const hostRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'host@blockvote.local',
        password: process.env.DEMO_HOST_PASSWORD || 'Host#Pass2026!bv',
      });
    hostToken = hostRes.body.data.token;
    hostUser = hostRes.body.data.user;
  });

  afterAll(async () => {
    await seedAccounts();
    await mongoose.connection.close();
  });

  // TEST 1: Admin creates election
  test('TEST 1: Admin creates public election with future dates -> saved as UPCOMING and PUBLIC', async () => {
    const futureStart = new Date(Date.now() + 86400000).toISOString();
    const futureEnd = new Date(Date.now() + 172800000).toISOString();

    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Student Council Election 2026',
        description: 'Annual democratic student council voting across all faculties',
        startTime: futureStart,
        endTime: futureEnd,
        type: 'General',
        organization: 'Student Union',
        category: 'Campus Governance',
        visibility: 'PUBLIC',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('UPCOMING');
    expect(res.body.data.visibility).toBe('PUBLIC');
    publicUpcomingId = res.body.data.id;
  });

  // TEST 2: Election exists in database
  test('TEST 2: Election exists directly in the canonical MongoDB database', async () => {
    const electionInDb = await Election.findById(publicUpcomingId);
    expect(electionInDb).toBeDefined();
    expect(electionInDb.title).toBe('Student Council Election 2026');
    expect(electionInDb.status).toBe('UPCOMING');
    expect(electionInDb.visibility).toBe('PUBLIC');
  });

  // TEST 3: User elections endpoint returns election
  test('TEST 3: User elections endpoint GET /api/elections returns admin-created election to normal voter', async () => {
    const res = await request(app)
      .get('/api/elections')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const elections = res.body.data.elections;
    const found = elections.find((e) => e.id === publicUpcomingId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Student Council Election 2026');
    expect(found.status).toBe('UPCOMING');
  });

  // TEST 4: Search exact title
  test('TEST 4: User searches exact title and finds the election', async () => {
    const res = await request(app)
      .get('/api/elections?q=Student%20Council%20Election%202026')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.elections[0].title).toBe('Student Council Election 2026');
  });

  // TEST 5: Search partial title
  test('TEST 5: User searches partial title "Student" and finds the election', async () => {
    const res = await request(app)
      .get('/api/elections?q=Student')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    const found = res.body.data.elections.find((e) => e.id === publicUpcomingId);
    expect(found).toBeDefined();
  });

  // TEST 6: Search case-insensitively
  test('TEST 6: User searches case-insensitively "student council" and "STUDENT" and finds it', async () => {
    const resLower = await request(app)
      .get('/api/elections?q=student%20council')
      .set('Authorization', `Bearer ${voter2Token}`);
    expect(resLower.status).toBe(200);
    expect(resLower.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);

    const resUpper = await request(app)
      .get('/api/elections?q=STUDENT')
      .set('Authorization', `Bearer ${voter2Token}`);
    expect(resUpper.status).toBe(200);
    expect(resUpper.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
  });

  // TEST 7: Search by description
  test('TEST 7: User searches keyword in description "democratic" and finds it', async () => {
    const res = await request(app)
      .get('/api/elections?q=democratic')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
  });

  // TEST 8: Non-existent search query returns empty array
  test('TEST 8: Non-existent search query returns empty array with zero count', async () => {
    const res = await request(app)
      .get('/api/elections?q=xyznonexistentterm999')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.length).toBe(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  // TEST 9: Add candidates to UPCOMING election
  test('TEST 9: Candidates can be added to an UPCOMING election before it starts', async () => {
    const cand1 = await request(app)
      .post(`/api/candidates/${publicUpcomingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sarah Connor',
        party: 'Cyber Resilience Party',
        description: 'Advocating for secure, open digital protocols',
      });
    expect(cand1.status).toBe(201);

    const cand2 = await request(app)
      .post(`/api/candidates/${publicUpcomingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Matrix',
        party: 'Student Action Alliance',
        description: 'Campus services reform and accessibility',
      });
    expect(cand2.status).toBe(201);
  });

  // TEST 10: User views election details with candidates
  test('TEST 10: Voter views election details GET /api/elections/:id and sees candidates', async () => {
    const res = await request(app)
      .get(`/api/elections/${publicUpcomingId}`)
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(publicUpcomingId);
    expect(res.body.data.title).toBe('Student Council Election 2026');
    expect(res.body.data.candidates.length).toBe(2);
  });

  // TEST 11: Date logic for ACTIVE election
  test('TEST 11: Admin creates election spanning current time -> saved as ACTIVE', async () => {
    const pastStart = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const futureEnd = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Department Representative Election',
        description: 'Active vote for department representative',
        startTime: pastStart,
        endTime: futureEnd,
        visibility: 'PUBLIC',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');
    publicActiveId = res.body.data.id;
  });

  // TEST 12: Filter by status ACTIVE
  test('TEST 12: User filters by status=ACTIVE and finds active election', async () => {
    const res = await request(app)
      .get('/api/elections?status=ACTIVE')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    const active = res.body.data.elections.find((e) => e.id === publicActiveId);
    expect(active).toBeDefined();
    // UPCOMING election should NOT appear in status=ACTIVE
    expect(res.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(false);
  });

  // TEST 13: Filter by status UPCOMING
  test('TEST 13: User filters by status=UPCOMING and finds upcoming election', async () => {
    const res = await request(app)
      .get('/api/elections?status=UPCOMING')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
    expect(res.body.data.elections.some((e) => e.id === publicActiveId)).toBe(false);
  });

  // TEST 14: Combined search and status filter
  test('TEST 14: Combined search and filter ?q=Department&status=ACTIVE works', async () => {
    const res = await request(app)
      .get('/api/elections?q=Department&status=ACTIVE')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.some((e) => e.id === publicActiveId)).toBe(true);
  });

  // TEST 15: Private election created by Admin
  test('TEST 15: Admin creates PRIVATE election -> normal user cannot discover it', async () => {
    const futureStart = new Date(Date.now() + 86400000).toISOString();
    const futureEnd = new Date(Date.now() + 172800000).toISOString();

    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Executive Board Confidential Election',
        description: 'Private election for leadership members only',
        startTime: futureStart,
        endTime: futureEnd,
        visibility: 'PRIVATE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.visibility).toBe('PRIVATE');
    privateElectionId = res.body.data.id;

    // Normal voter searches for it
    const voterSearch = await request(app)
      .get('/api/elections?q=Confidential')
      .set('Authorization', `Bearer ${voter1Token}`);
    expect(voterSearch.status).toBe(200);
    expect(voterSearch.body.data.elections.length).toBe(0);

    // Normal voter requests details -> 403 Forbidden
    const voterDetail = await request(app)
      .get(`/api/elections/${privateElectionId}`)
      .set('Authorization', `Bearer ${voter1Token}`);
    expect(voterDetail.status).toBe(403);
  });

  // TEST 16: Admin can see private election
  test('TEST 16: Admin CAN discover and view private election', async () => {
    const adminSearch = await request(app)
      .get('/api/elections?q=Confidential')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminSearch.status).toBe(200);
    expect(adminSearch.body.data.elections.some((e) => e.id === privateElectionId)).toBe(true);

    const adminDetail = await request(app)
      .get(`/api/elections/${privateElectionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDetail.status).toBe(200);
    expect(adminDetail.body.data.id).toBe(privateElectionId);
  });

  // TEST 17: Host creates public election -> discoverable by voters
  test('TEST 17: Approved Host creates public election -> discoverable by all voters', async () => {
    const futureStart = new Date(Date.now() + 86400000).toISOString();
    const futureEnd = new Date(Date.now() + 172800000).toISOString();

    const res = await request(app)
      .post('/api/elections')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Host Faculty Ballot',
        description: 'Created by host user',
        startTime: futureStart,
        endTime: futureEnd,
        visibility: 'PUBLIC',
      });

    expect(res.status).toBe(201);
    hostElectionId = res.body.data.id;

    const voterSearch = await request(app)
      .get('/api/elections?q=Faculty')
      .set('Authorization', `Bearer ${voter2Token}`);
    expect(voterSearch.status).toBe(200);
    expect(voterSearch.body.data.elections.some((e) => e.id === hostElectionId)).toBe(true);
  });

  // TEST 18: Normal voter cannot modify or delete election (Separation of discovery vs ownership)
  test('TEST 18: Normal voter cannot modify or delete admin or host election', async () => {
    const patchRes = await request(app)
      .patch(`/api/elections/${publicUpcomingId}`)
      .set('Authorization', `Bearer ${voter1Token}`)
      .send({ title: 'Hacked Title' });
    expect(patchRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/elections/${publicUpcomingId}`)
      .set('Authorization', `Bearer ${voter1Token}`);
    expect(deleteRes.status).toBe(403);
  });

  // TEST 19: Multiple separate authenticated voter sessions find the election
  test('TEST 19: Multiple distinct voter sessions (voter1, voter2, host) independently discover admin election', async () => {
    const v1Res = await request(app).get('/api/elections?q=Student').set('Authorization', `Bearer ${voter1Token}`);
    const v2Res = await request(app).get('/api/elections?q=Student').set('Authorization', `Bearer ${voter2Token}`);
    const hRes = await request(app).get('/api/elections?q=Student').set('Authorization', `Bearer ${hostToken}`);

    expect(v1Res.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
    expect(v2Res.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
    expect(hRes.body.data.elections.some((e) => e.id === publicUpcomingId)).toBe(true);
  });

  // TEST 20: Pagination works correctly
  test('TEST 20: Pagination returns correct page and limit structure', async () => {
    const res = await request(app)
      .get('/api/elections?page=1&limit=2')
      .set('Authorization', `Bearer ${voter1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.elections.length).toBeLessThanOrEqual(2);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(2);
    expect(res.body.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });
});
