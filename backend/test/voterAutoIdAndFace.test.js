const request = require('supertest');
const app = require('../src/app');
const { mongoose, User, initDatabase } = require('../src/models');
const { seedAccounts } = require('../src/scripts/seedAccounts');

jest.setTimeout(30000);

describe('Automatic Voter ID Generation & Face Authentication Test Suite', () => {
  beforeAll(async () => {
    await initDatabase();
    await User.deleteMany({});
    await seedAccounts();
  });

  afterAll(async () => {
    await seedAccounts();
    await mongoose.connection.close();
  });

  test('TEST F1: Public endpoint GET /api/auth/generate-voter-id returns a valid unique Voter ID', async () => {
    const res = await request(app).get('/api/auth/generate-voter-id');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.voterId).toBeDefined();
    expect(res.body.data.voterId).toMatch(/^VTR-[A-Z0-9]{8}$/);
  });

  test('TEST F2: Registration without voterId auto-assigns a unique Voter ID', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Auto ID Test User',
        email: 'autoid.user@blockvote.local',
        password: 'Pass123!Secure',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.voterId).toBeDefined();
    expect(res.body.data.user.voterId).toMatch(/^VTR-[A-Z0-9]{8}$/);
  });

  test('TEST F3: Registration with faceData stores facial biometric authorization', async () => {
    const mockFaceData = 'data:image/jpeg;base64,mockFaceSnapshotDataString12345';

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Face Scan User',
        email: 'facescan.user@blockvote.local',
        password: 'Pass123!Secure',
        faceData: mockFaceData,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isFaceVerified).toBe(true);

    const userInDb = await User.findOne({ email: 'facescan.user@blockvote.local' });
    expect(userInDb).toBeDefined();
    expect(userInDb.faceData).toBe(mockFaceData);
    expect(userInDb.isFaceVerified).toBe(true);
  });

  test('TEST F4: Registration with fingerprintData stores fingerprint biometric authorization', async () => {
    const mockFingerprint = 'FP-BIO-89AC4F2E11BB00DD';

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Fingerprint User',
        email: 'fingerprint.user@blockvote.local',
        password: 'Pass123!Secure',
        fingerprintData: mockFingerprint,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isFingerprintVerified).toBe(true);

    const userInDb = await User.findOne({ email: 'fingerprint.user@blockvote.local' });
    expect(userInDb).toBeDefined();
    expect(userInDb.fingerprintData).toBe(mockFingerprint);
    expect(userInDb.isFingerprintVerified).toBe(true);
  });
});
