const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Election, Candidate, AuditLog, initDatabase } = require('../src/models');
const config = require('../src/config/config');
const { seedAccounts } = require('../src/scripts/seedAccounts');

jest.setTimeout(30000);

describe('Audit Logging & Reporting Subsystem Test Suite', () => {
  let adminToken;
  let voterToken;
  let voterId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await initDatabase();
    await seedAccounts();

    // Login as Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@blockvote.local',
        password: process.env.ADMIN_PASSWORD || 'Admin#BV2026!SecP@ss',
      });
    adminToken = adminLoginRes.body.data.token;

    // Login as Voter
    const voterLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'voter1@blockvote.local',
        password: process.env.DEMO_VOTER1_PASSWORD || 'Voter1#Pass2026!bv',
      });
    voterToken = voterLoginRes.body.data.token;
    voterId = voterLoginRes.body.data.user.id;
  });

  afterAll(async () => {
    await seedAccounts();
    await sequelize.close();
  });

  test('TEST A1: Audit log recorded on user login', async () => {
    const logs = await AuditLog.findAll({
      where: { action: 'USER_LOGIN' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].category).toBe('AUTH');
  });

  test('TEST A2: Admin can fetch audit logs with stats', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs).toBeDefined();
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalLogs).toBeGreaterThanOrEqual(1);
  });

  test('TEST A3: Non-admin is rejected from audit logs (403)', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${voterToken}`);

    expect(res.status).toBe(403);
  });

  test('TEST A4: Admin can export audit logs as CSV', async () => {
    const res = await request(app)
      .get('/api/audit-logs/export?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('ID,Timestamp,Category,Action');
  });

  test('TEST A5: Admin can fetch system summary report', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.voters).toBeDefined();
    expect(res.body.data.elections).toBeDefined();
    expect(res.body.data.hostRequests).toBeDefined();
  });

  test('TEST A6: Admin can fetch per-election analytics reports', async () => {
    const res = await request(app)
      .get('/api/reports/elections')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reports).toBeDefined();
  });

  test('TEST A7: Admin can export voters list as CSV', async () => {
    const res = await request(app)
      .get('/api/reports/export?type=voters&format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('ID,Voter ID,Name,Email');
    expect(res.text).not.toContain('passwordHash');
  });

  test('TEST A8: Admin toggles voter eligibility and audit log is recorded', async () => {
    const res = await request(app)
      .patch(`/api/voters/${voterId}/eligibility`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEligible: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isEligible).toBe(false);

    // Verify audit log
    const audit = await AuditLog.findOne({
      where: {
        action: 'VOTER_ELIGIBILITY_UPDATED',
        targetId: String(voterId),
      },
    });
    expect(audit).toBeDefined();
  });
});
