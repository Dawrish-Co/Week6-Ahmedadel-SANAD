const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const TrainingApplication = require('../models/Application');

const JWT_SECRET = 'test-only-secret';
let mongoServer;
let userId;
let otherUserId;
let courseId;
let authHeader;

function tokenFor(id) {
  return jwt.sign({ sub: id }, JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await TrainingApplication.deleteMany({});
  userId = new mongoose.Types.ObjectId().toString();
  otherUserId = new mongoose.Types.ObjectId().toString();
  courseId = new mongoose.Types.ObjectId().toString();
  authHeader = `Bearer ${tokenFor(userId)}`;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  delete process.env.JWT_SECRET;
});

describe('Training application API', () => {
  test('creates an application and sets audit fields from the authenticated user', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader)
      .send({ courseId, applicantId: userId, notes: 'Please consider my application.' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      courseId,
      applicantId: userId,
      status: 'PENDING',
      notes: 'Please consider my application.',
      createdBy: userId,
      updatedBy: userId,
    });
    expect(response.body.data.createdAt).toBeDefined();
    expect(response.body.data.updatedAt).toBeDefined();
  });

  test('lists only the authenticated user applications', async () => {
    await TrainingApplication.create([
      { courseId, applicantId: userId, createdBy: userId, updatedBy: userId },
      {
        courseId: new mongoose.Types.ObjectId(),
        applicantId: otherUserId,
        createdBy: otherUserId,
        updatedBy: otherUserId,
      },
    ]);

    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].applicantId).toBe(userId);
  });

  test('returns 400 for invalid request data', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader)
      .send({ courseId: 'not-an-object-id', applicantId: userId });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'courseId' })]),
    );
  });

  test('rejects an applicant id that differs from the authenticated user', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', authHeader)
      .send({ courseId, applicantId: otherUserId });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Applicant must match the authenticated user');
  });

  test.each([
    ['POST', '/api/applications'],
    ['GET', '/api/applications'],
  ])('returns 401 for unauthenticated %s requests', async (method, path) => {
    const response =
      method === 'POST'
        ? await request(app).post(path).send({ courseId, applicantId: userId })
        : await request(app).get(path);

    expect(response.status).toBe(401);
  });
});
