const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const {
  mongoose,
  User,
  WebAuthnCredential,
  AuditLog,
  initDatabase,
} = require('../src/models');
const config = require('../src/config/config');
const { seedAccounts } = require('../src/scripts/seedAccounts');
const { storeChallenge, consumeChallenge } = require('../src/controllers/webauthnController');

jest.setTimeout(30000);

describe('WebAuthn & Biometric Authentication Security Test Suite', () => {
  let testUser;
  let testUserToken;
  let preAuthToken;
  let adminUser;
  let adminToken;
  let hostUser;

  const mockCredId1 = 'cred_mock_touch_id_laptop_12345';
  const mockCredId2 = 'cred_mock_face_id_phone_67890';
  const mockPublicKey = Buffer.from('mock_public_key_cbor_encoded_bytes').toString('base64url');

  beforeAll(async () => {
    await initDatabase();
    await User.deleteMany({});
    await WebAuthnCredential.deleteMany({});
    await AuditLog.deleteMany({});
    await seedAccounts();

    testUser = await User.create({
      voterId: 'VOTER_BIOMETRIC_01',
      name: 'Biometric Test Voter',
      email: 'biometric.voter@blockvote.local',
      passwordHash: await User.hashPassword('Pass123!Secure'),
      role: 'VOTER',
      hostPermissionStatus: 'NONE',
      isEligible: true,
    });

    testUserToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role, type: 'access' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    preAuthToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role, type: 'pre-auth' },
      config.jwt.secret,
      { expiresIn: '5m' }
    );

    adminUser = await User.findOne({ role: 'ADMIN' });
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role, type: 'access' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    hostUser = await User.findOne({ email: 'host@blockvote.local' });
  });

  afterAll(async () => {
    await seedAccounts();
    await mongoose.connection.close();
  });

  test('TEST 1: New user has hasCredentials = false', async () => {
    const res = await request(app)
      .get(`/api/auth/webauthn/credentials/check/${testUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasCredentials).toBe(false);
    expect(res.body.data.count).toBe(0);
  });

  test('TEST 2: Authenticated user can generate WebAuthn registration options', async () => {
    const res = await request(app)
      .post('/api/auth/webauthn/register/options')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challenge).toBeDefined();
    expect(res.body.data.rp.name).toBe(config.webauthn.rpName);
    expect(res.body.data.rp.id).toBe(config.webauthn.rpID);
    expect(res.body.data.user.name).toBe(testUser.email);
    expect(res.body.data.authenticatorSelection.authenticatorAttachment).toBe('platform');
    expect(res.body.data.authenticatorSelection.userVerification).toBe('required');
  });

  test('TEST 3: User with preAuthToken can request registration options during onboarding', async () => {
    const res = await request(app)
      .post('/api/auth/webauthn/register/options')
      .set('Authorization', `Bearer ${preAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challenge).toBeDefined();
  });

  test('TEST 4: Unauthenticated request to registration options is rejected (401)', async () => {
    const res = await request(app)
      .post('/api/auth/webauthn/register/options');

    expect(res.status).toBe(401);
  });

  test('TEST 5: Challenges are single-use and cannot be replayed', () => {
    const challenge = 'test_random_challenge_xyz123';
    storeChallenge(testUser.id, 'register', challenge);

    const consumed1 = consumeChallenge(testUser.id, 'register');
    expect(consumed1).toBe(challenge);

    const consumed2 = consumeChallenge(testUser.id, 'register');
    expect(consumed2).toBeNull();
  });

  test('TEST 6: Store registered WebAuthn credential metadata (Laptop Touch ID)', async () => {
    const cred = await WebAuthnCredential.create({
      userId: testUser.id,
      credentialId: mockCredId1,
      publicKey: mockPublicKey,
      counter: 0,
      transports: ['internal'],
      deviceName: 'MacBook Touch ID',
    });

    expect(cred.id).toBeDefined();
    expect(cred.credentialId).toBe(mockCredId1);
    expect(String(cred.userId)).toBe(String(testUser.id));
    expect(cred.deviceName).toBe('MacBook Touch ID');

    const checkRes = await request(app)
      .get(`/api/auth/webauthn/credentials/check/${testUser.id}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.hasCredentials).toBe(true);
    expect(checkRes.body.data.count).toBe(1);
  });

  test('TEST 7: Duplicate credentialId cannot be registered (unique constraint)', async () => {
    await expect(
      WebAuthnCredential.create({
        userId: testUser.id,
        credentialId: mockCredId1,
        publicKey: mockPublicKey,
        counter: 0,
      })
    ).rejects.toThrow();
  });

  test('TEST 8: Register second authenticator (Phone Face ID) for same user', async () => {
    const cred2 = await WebAuthnCredential.create({
      userId: testUser.id,
      credentialId: mockCredId2,
      publicKey: mockPublicKey,
      counter: 0,
      transports: ['internal'],
      deviceName: 'iPhone Face ID',
    });

    expect(cred2.id).toBeDefined();
    expect(cred2.credentialId).toBe(mockCredId2);

    const listRes = await request(app)
      .get('/api/auth/webauthn/credentials')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(2);
    expect(listRes.body.data[0].deviceName).toBeDefined();
    expect(listRes.body.data[0].publicKey).toBeUndefined();
  });

  test('TEST 9: Generate authentication options for user with credentials', async () => {
    const res = await request(app)
      .post('/api/auth/webauthn/authenticate/options')
      .send({ userId: testUser.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challenge).toBeDefined();
    expect(res.body.data.rpId).toBe(config.webauthn.rpID);
    expect(res.body.data.allowCredentials.length).toBe(2);
    expect(res.body.data.userVerification).toBe('required');
  });

  test('TEST 10: Authentication options for user without credentials returns NO_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/webauthn/authenticate/options')
      .send({ userId: adminUser.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('NO_CREDENTIALS');
  });

  test('TEST 11: WebAuthn authentication assertion with unknown credential is rejected', async () => {
    storeChallenge(testUser.id, 'authenticate', 'test_challenge_abc');

    const res = await request(app)
      .post('/api/auth/webauthn/authenticate/verify')
      .send({
        userId: testUser.id,
        credential: {
          id: 'non_existent_credential_id',
          rawId: 'non_existent_raw_id',
          response: {},
          type: 'public-key',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Unknown authenticator');
  });

  test('TEST 12: WebAuthn credential belonging to User A cannot authenticate User B', async () => {
    storeChallenge(adminUser.id, 'authenticate', 'test_challenge_def');

    const res = await request(app)
      .post('/api/auth/webauthn/authenticate/verify')
      .send({
        userId: adminUser.id,
        credential: {
          id: mockCredId1,
          response: {},
          type: 'public-key',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('does not match user');
  });

  test('TEST 13: Authenticated user can rename their registered authenticator', async () => {
    const cred = await WebAuthnCredential.findOne({ credentialId: mockCredId1 });

    const res = await request(app)
      .patch(`/api/auth/webauthn/credentials/${cred.id}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ deviceName: 'Work Laptop (Updated)' });

    expect(res.status).toBe(200);
    expect(res.body.data.deviceName).toBe('Work Laptop (Updated)');

    const updated = await WebAuthnCredential.findById(cred.id);
    expect(updated.deviceName).toBe('Work Laptop (Updated)');
  });

  test('TEST 14: Authenticated user can remove a registered authenticator', async () => {
    const cred = await WebAuthnCredential.findOne({ credentialId: mockCredId2 });

    const res = await request(app)
      .delete(`/api/auth/webauthn/credentials/${cred.id}`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('removed successfully');

    const removed = await WebAuthnCredential.findById(cred.id);
    expect(removed).toBeNull();

    const checkRes = await request(app)
      .get(`/api/auth/webauthn/credentials/check/${testUser.id}`);
    expect(checkRes.body.data.count).toBe(1);
  });

  test('TEST 15: User cannot delete another user authenticator', async () => {
    const cred = await WebAuthnCredential.findOne({ credentialId: mockCredId1 });

    const res = await request(app)
      .delete(`/api/auth/webauthn/credentials/${cred.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test('TEST 16: Pre-auth token is rejected on protected routes (BIOMETRIC_REQUIRED)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${preAuthToken}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BIOMETRIC_REQUIRED');
  });

  test('TEST 17: Voter retains VOTER role after authentication', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('VOTER');
  });

  test('TEST 18: Normal voter is forbidden from accessing admin endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(403);
  });

  test('TEST 19: Approved election host is VOTER with hostPermissionStatus = APPROVED', async () => {
    const hostToken = jwt.sign(
      { userId: hostUser.id, email: hostUser.email, role: hostUser.role, type: 'access' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${hostToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('VOTER');
    expect(res.body.data.user.hostPermissionStatus).toBe('APPROVED');
  });

  test('TEST 20: Audit logs record WebAuthn events without sensitive data', async () => {
    const logs = await AuditLog.find({ category: 'AUTH' });

    expect(logs.length).toBeGreaterThanOrEqual(1);

    for (const log of logs) {
      const detailsStr = JSON.stringify(log.details || {});
      expect(detailsStr).not.toContain('fingerprint');
      expect(detailsStr).not.toContain('faceImage');
      expect(detailsStr).not.toContain('privateKey');
      expect(detailsStr).not.toContain('rawBiometric');
    }
  });
});
