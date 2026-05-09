const request = require('supertest');

// Mock pg module before requiring index.js
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: mockQuery,
  release: jest.fn(),
};

jest.mock('pg', () => {
  const mPool = {
    query: mockQuery,
    connect: mockConnect.mockResolvedValue(mockClient),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, server } = require('../src/index');

describe('Rewards Store Service API', () => {
  let originalConsoleError;
  let originalConsoleLog;

  beforeAll(() => {
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll((done) => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    server.close(done);
  });

  beforeEach(() => {
    mockQuery.mockClear();
    mockConnect.mockClear();
    mockClient.release.mockClear();
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('healthy');
    });

    it('should return 503 if db check fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(503);
      expect(res.body.status).toEqual('unhealthy');
    });
  });

  describe('GET /api/rewards/merchandise', () => {
    it('should return all available merchandise', async () => {
      const mockRows = [
        { id: 1, name: 'T-Shirt', cost_in_points: 100 },
        { id: 2, name: 'Mug', cost_in_points: 50 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const res = await request(app).get('/api/rewards/merchandise');

      expect(res.statusCode).toEqual(200);
      expect(res.body.merchandise).toEqual(mockRows);
      expect(res.body.count).toEqual(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM merchandise WHERE is_available = true ORDER BY cost_in_points ASC'));
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/rewards/merchandise');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('GET /api/rewards/merchandise/:merchandiseId', () => {
    it('should return a single merchandise item', async () => {
      const mockRow = { id: 1, name: 'T-Shirt', cost_in_points: 100 };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.item).toEqual(mockRow);
    });

    it('should return 404 if item not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/rewards/merchandise/999');
      expect(res.statusCode).toEqual(404);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('GET /api/rewards/user/:userId/balance', () => {
    it('should return user balance', async () => {
      const mockRow = { id: 1, username: 'testuser', quest_points: 500 };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toEqual(200);
      expect(res.body.balance).toEqual(500);
      expect(res.body.user).toEqual(mockRow);
    });

    it('should return 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/rewards/user/999/balance');
      expect(res.statusCode).toEqual(404);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('GET /api/rewards/user/:userId/transactions', () => {
    it('should return user transactions', async () => {
      const mockRows = [{ id: 1, merchandise_id: 2 }];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toEqual(200);
      expect(res.body.transactions).toEqual(mockRows);
      expect(res.body.count).toEqual(1);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('POST /api/rewards/claim', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1 });
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 for invalid quantity', async () => {
      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 0 });
      expect(res.statusCode).toEqual(400);
    });

    it('should successfully claim merchandise', async () => {
      const mockMerch = { id: 2, name: 'Mug', cost_in_points: 50, stock_quantity: 10 };
      const mockUser = { id: 1, username: 'testuser', quest_points: 100 };

      mockQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockMerch] }) // Merch check
        .mockResolvedValueOnce({ rows: [mockUser] }) // User check
        .mockResolvedValueOnce({ rows: [{ ...mockUser, quest_points: 50 }] }) // Deduct points
        .mockResolvedValueOnce() // Reduce stock
        .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, merchandise_id: 2 }] }) // Insert tx
        .mockResolvedValueOnce(); // COMMIT

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('Successfully claimed');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle insufficient stock', async () => {
      const mockMerch = { id: 2, name: 'Mug', cost_in_points: 50, stock_quantity: 0 };

      mockQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockMerch] }) // Merch check
        .mockResolvedValueOnce(); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Insufficient stock');
    });

    it('should handle insufficient points', async () => {
      const mockMerch = { id: 2, name: 'Mug', cost_in_points: 50, stock_quantity: 10 };
      const mockUser = { id: 1, username: 'testuser', quest_points: 10 };

      mockQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockMerch] }) // Merch check
        .mockResolvedValueOnce({ rows: [mockUser] }) // User check
        .mockResolvedValueOnce(); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Insufficient quest points');
    });

    it('should handle merchandise not found', async () => {
      mockQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Merch check
        .mockResolvedValueOnce(); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toContain('Merchandise not found');
    });

    it('should handle user not found', async () => {
      const mockMerch = { id: 2, name: 'Mug', cost_in_points: 50, stock_quantity: 10 };

      mockQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockMerch] }) // Merch check
        .mockResolvedValueOnce({ rows: [] }) // User check
        .mockResolvedValueOnce(); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('User not found');
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 2, quantity: 1 });
      expect(res.statusCode).toEqual(500);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/rewards/merchandise', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/api/rewards/merchandise').send({ name: 'Hat' });
      expect(res.statusCode).toEqual(400);
    });

    it('should create new merchandise', async () => {
      const mockRow = { id: 3, name: 'Hat', cost_in_points: 150, stock_quantity: 20 };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const res = await request(app).post('/api/rewards/merchandise').send({ name: 'Hat', cost_in_points: 150, stock_quantity: 20 });
      expect(res.statusCode).toEqual(201);
      expect(res.body.item).toEqual(mockRow);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).post('/api/rewards/merchandise').send({ name: 'Hat', cost_in_points: 150, stock_quantity: 20 });
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('PUT /api/rewards/merchandise/:merchandiseId', () => {
    it('should return 404 if item not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // current

      const res = await request(app).put('/api/rewards/merchandise/999').send({ name: 'Updated' });
      expect(res.statusCode).toEqual(404);
    });

    it('should update merchandise', async () => {
      const mockCurrent = { id: 1, name: 'Hat', cost_in_points: 150, stock_quantity: 20 };
      const mockUpdated = { id: 1, name: 'Updated Hat', cost_in_points: 150, stock_quantity: 20 };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockCurrent] })
        .mockResolvedValueOnce({ rows: [mockUpdated] });

      const res = await request(app).put('/api/rewards/merchandise/1').send({ name: 'Updated Hat' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.item).toEqual(mockUpdated);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).put('/api/rewards/merchandise/1').send({ name: 'Updated Hat' });
      expect(res.statusCode).toEqual(500);
    });
  });
});
