const request = require('supertest');

// Mock pg module before requiring app
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn(() => Promise.resolve(mClient)),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, pool, server } = require('../src/index');

let mClient;

beforeEach(() => {
  jest.clearAllMocks();
  mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  // Setup the pool.connect mock to return our client
  pool.connect.mockResolvedValue(mClient);
});

afterAll((done) => {
  server.close(done);
});

describe('POST /api/rewards/claim', () => {
  test('should fail if missing required fields', async () => {
    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ merchandise_id: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required fields');
  });

  test('should fail if quantity < 1', async () => {
    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Quantity must be at least 1');
  });

  test('should fail if merchandise not found or unavailable', async () => {
    // Return mock rows
    mClient.query.mockImplementation((query) => {
      if (query.includes('SELECT * FROM merchandise')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Merchandise not found or unavailable');
    expect(mClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mClient.release).toHaveBeenCalled();
  });

  test('should fail if insufficient stock', async () => {
    mClient.query.mockImplementation((query) => {
      if (query.includes('SELECT * FROM merchandise')) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 0 }]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Insufficient stock');
    expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should fail if user not found', async () => {
    mClient.query.mockImplementation((query) => {
      if (query.includes('SELECT * FROM merchandise')) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 }]
        });
      }
      if (query.includes('SELECT id, username, quest_points FROM users')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('User not found');
    expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should fail if user has insufficient quest points', async () => {
    mClient.query.mockImplementation((query) => {
      if (query.includes('SELECT * FROM merchandise')) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 }]
        });
      }
      if (query.includes('SELECT id, username, quest_points FROM users')) {
        return Promise.resolve({
          rows: [{ id: 1, username: 'testuser', quest_points: 50 }]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Insufficient quest points');
    expect(res.body.required).toBe(100);
    expect(res.body.available).toBe(50);
    expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should successfully claim merchandise', async () => {
    mClient.query.mockImplementation((query) => {
      if (query.includes('SELECT * FROM merchandise')) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 }]
        });
      }
      if (query.includes('SELECT id, username, quest_points FROM users')) {
        return Promise.resolve({
          rows: [{ id: 1, username: 'testuser', quest_points: 150 }]
        });
      }
      if (query.includes('UPDATE users SET quest_points')) {
        return Promise.resolve({
          rows: [{ id: 1, username: 'testuser', quest_points: 50 }]
        });
      }
      if (query.includes('UPDATE merchandise SET stock_quantity')) {
        return Promise.resolve({ rows: [] });
      }
      if (query.includes('INSERT INTO rewards_transactions')) {
        return Promise.resolve({
          rows: [{ id: 101, user_id: 1, merchandise_id: 1, quantity: 1, points_spent: 100, status: 'completed' }]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Successfully claimed 1x T-Shirt! 🎉');
    expect(res.body.points_spent).toBe(100);
    expect(res.body.remaining_points).toBe(50);
    expect(mClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mClient.release).toHaveBeenCalled();
  });

  test('should handle database errors gracefully', async () => {
    // Force a DB error on BEGIN
    mClient.query.mockRejectedValueOnce(new Error('Database connection lost'));

    const res = await request(app)
      .post('/api/rewards/claim')
      .send({ user_id: 1, merchandise_id: 1, quantity: 1 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to claim merchandise');
    expect(mClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mClient.release).toHaveBeenCalled();
  });
});
