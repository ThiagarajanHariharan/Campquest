const request = require('supertest');

// Mock pg module
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn(() => ({
  query: mockQuery,
  release: mockRelease,
}));

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
      connect: mockConnect,
    })),
  };
});

const { app, server } = require('./index');

describe('Rewards Store Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('rewards-store');
      expect(res.body.database).toBe('connected');
    });

    it('should return 503 and unhealthy status on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Connection Failed'));
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.error).toBe('DB Connection Failed');
    });
  });

  describe('GET /api/rewards/merchandise', () => {
    it('should return 200 and list of available merchandise', async () => {
      const mockRows = [
        { id: 1, name: 'T-Shirt', is_available: true, cost_in_points: 100 },
        { id: 2, name: 'Mug', is_available: true, cost_in_points: 50 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const res = await request(app).get('/api/rewards/merchandise');
      expect(res.statusCode).toBe(200);
      expect(res.body.merchandise).toEqual(mockRows);
      expect(res.body.count).toBe(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM merchandise WHERE is_available = true ORDER BY cost_in_points ASC')
      );
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/merchandise');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/merchandise/:merchandiseId', () => {
    it('should return 200 and merchandise item', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', is_available: true, cost_in_points: 100 };
      mockQuery.mockResolvedValueOnce({ rows: [mockItem] });

      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.item).toEqual(mockItem);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM merchandise WHERE id = $1'),
        ['1']
      );
    });

    it('should return 404 if merchandise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/rewards/merchandise/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Merchandise not found');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/user/:userId/balance', () => {
    it('should return 200 and user balance', async () => {
      const mockUser = { id: 1, username: 'testuser', quest_points: 500 };
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toEqual(mockUser);
      expect(res.body.balance).toBe(500);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, quest_points FROM users WHERE id = $1'),
        ['1']
      );
    });

    it('should return 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/rewards/user/999/balance');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch balance');
    });
  });

  describe('GET /api/rewards/user/:userId/transactions', () => {
    it('should return 200 and user transactions', async () => {
      const mockTransactions = [
        { id: 1, user_id: 1, merchandise_name: 'T-Shirt', points_spent: 100 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockTransactions });

      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toBe(200);
      expect(res.body.transactions).toEqual(mockTransactions);
      expect(res.body.count).toBe(1);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch transactions');
    });
  });

  describe('POST /api/rewards/claim', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Missing required fields: user_id, merchandise_id');
    });

    it('should return 400 if quantity < 1', async () => {
      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1, quantity: 0 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Quantity must be at least 1');
    });

    it('should claim merchandise successfully', async () => {
      // Mock BEGIN
      mockQuery.mockResolvedValueOnce({});
      // Mock SELECT merchandise FOR UPDATE
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 5 }] });
      // Mock SELECT users FOR UPDATE
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', quest_points: 500 }] });
      // Mock UPDATE users
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', quest_points: 400 }] });
      // Mock UPDATE merchandise
      mockQuery.mockResolvedValueOnce({});
      // Mock INSERT transaction
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, points_spent: 100 }] });
      // Mock COMMIT
      mockQuery.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1, quantity: 1 });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('Successfully claimed');
      expect(mockQuery).toHaveBeenCalledTimes(7); // BEGIN + 5 queries + COMMIT
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if merchandise not found', async () => {
      mockQuery.mockResolvedValueOnce({}); // BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Merchandise not found
      mockQuery.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Merchandise not found or unavailable');
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if insufficient stock', async () => {
      mockQuery.mockResolvedValueOnce({}); // BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, cost_in_points: 100, stock_quantity: 0 }] }); // Out of stock
      mockQuery.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Insufficient stock');
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({}); // BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, cost_in_points: 100, stock_quantity: 5 }] }); // Merchandise
      mockQuery.mockResolvedValueOnce({ rows: [] }); // User not found
      mockQuery.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if insufficient points', async () => {
      mockQuery.mockResolvedValueOnce({}); // BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, cost_in_points: 100, stock_quantity: 5 }] }); // Merchandise
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, quest_points: 50 }] }); // Insufficient points
      mockQuery.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Insufficient quest points');
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should rollback and return 500 on db error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error')); // Fail BEGIN or anywhere

      const res = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1 });
      expect(res.statusCode).toBe(500);
      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK'); // Checks if rollback was attempted
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/rewards/merchandise', () => {
    it('should create new merchandise', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10, category: 'apparel' };
      mockQuery.mockResolvedValueOnce({ rows: [mockItem] });

      const res = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10, category: 'apparel'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Merchandise created!');
      expect(res.body.item).toEqual(mockItem);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/rewards/merchandise').send({ name: 'T-Shirt' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10
      });
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to create merchandise');
    });
  });

  describe('PUT /api/rewards/merchandise/:merchandiseId', () => {
    it('should update merchandise', async () => {
      const currentItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };
      const updatedItem = { ...currentItem, stock_quantity: 20 };

      mockQuery.mockResolvedValueOnce({ rows: [currentItem] }); // SELECT
      mockQuery.mockResolvedValueOnce({ rows: [updatedItem] }); // UPDATE

      const res = await request(app).put('/api/rewards/merchandise/1').send({ stock_quantity: 20 });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Merchandise updated!');
      expect(res.body.item).toEqual(updatedItem);
    });

    it('should return 404 if merchandise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // SELECT empty
      const res = await request(app).put('/api/rewards/merchandise/999').send({ stock_quantity: 20 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Merchandise not found');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).put('/api/rewards/merchandise/1').send({ stock_quantity: 20 });
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to update merchandise');
    });
  });

});
