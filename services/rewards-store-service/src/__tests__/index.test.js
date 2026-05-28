const request = require('supertest');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, pool, server } = require('../index');

afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('Rewards-Store Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('healthy');
      expect(res.body.service).toEqual('rewards-store');
    });

    it('should return 503 if db query fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(503);
      expect(res.body.status).toEqual('unhealthy');
      expect(res.body.error).toEqual('DB Error');
    });
  });

  describe('GET /api/rewards/merchandise', () => {
    it('should return merchandise list', async () => {
      const mockMerchandise = [
        { id: 1, name: 'T-Shirt', cost_in_points: 100 },
        { id: 2, name: 'Mug', cost_in_points: 50 }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockMerchandise });

      const res = await request(app).get('/api/rewards/merchandise');
      expect(res.statusCode).toEqual(200);
      expect(res.body.merchandise).toEqual(mockMerchandise);
      expect(res.body.count).toEqual(2);
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/merchandise');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/merchandise/:merchandiseId', () => {
    it('should return single merchandise item', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100 };
      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.item).toEqual(mockItem);
    });

    it('should return 404 if not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/rewards/merchandise/99');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Merchandise not found');
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/merchandise/1');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/user/:userId/balance', () => {
    it('should return user balance', async () => {
      const mockUser = { id: 1, username: 'testuser', quest_points: 1000 };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toEqual(200);
      expect(res.body.balance).toEqual(1000);
      expect(res.body.user).toEqual(mockUser);
    });

    it('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/rewards/user/99/balance');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('User not found');
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/user/1/balance');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to fetch balance');
    });
  });

  describe('GET /api/rewards/user/:userId/transactions', () => {
    it('should return user transactions', async () => {
      const mockTransactions = [
        { id: 1, user_id: 1, merchandise_id: 1, points_spent: 100 },
        { id: 2, user_id: 1, merchandise_id: 2, points_spent: 50 }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockTransactions });

      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toEqual(200);
      expect(res.body.transactions).toEqual(mockTransactions);
      expect(res.body.count).toEqual(2);
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/api/rewards/user/1/transactions');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to fetch transactions');
    });
  });

  describe('POST /api/rewards/claim', () => {
    it('should claim merchandise successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({});

      // Select merchandise
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 }]
      });

      // Select user
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', quest_points: 1000 }]
      });

      // Update user points
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', quest_points: 900 }]
      });

      // Update merchandise stock
      mockClient.query.mockResolvedValueOnce({});

      // Insert transaction
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, merchandise_id: 1, quantity: 1, points_spent: 100 }]
      });

      // COMMIT
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('Successfully claimed');
      expect(res.body.points_spent).toEqual(100);
      expect(res.body.remaining_points).toEqual(900);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1
        // missing merchandise_id
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 400 if quantity < 1', async () => {
      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 0
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Quantity must be at least 1');
    });

    it('should return 404 if merchandise not found', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({});

      // Select merchandise - empty rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // ROLLBACK is called inside the try block for empty merchandise
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 99,
        quantity: 1
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Merchandise not found or unavailable');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 400 if insufficient stock', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({});

      // Select merchandise - stock 0
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 0 }]
      });

      // ROLLBACK
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Insufficient stock');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({});

      // Select merchandise
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 }]
      });

      // Select user - empty rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // ROLLBACK
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 99,
        merchandise_id: 1,
        quantity: 1
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('User not found');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 400 if insufficient quest points', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockResolvedValueOnce({});

      // Select merchandise
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'T-Shirt', cost_in_points: 1000, stock_quantity: 10 }]
      });

      // Select user - insufficient points
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', quest_points: 500 }]
      });

      // ROLLBACK
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Insufficient quest points');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle db errors gracefully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValueOnce(mockClient);

      // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('DB Error'));

      // ROLLBACK is called inside the try block for empty merchandise
      mockClient.query.mockResolvedValueOnce({});

      const res = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to claim merchandise');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/rewards/merchandise', () => {
    it('should create merchandise successfully', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };
      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const res = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt',
        cost_in_points: 100,
        stock_quantity: 10
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Merchandise created!');
      expect(res.body.item).toEqual(mockItem);
    });

    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt'
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt',
        cost_in_points: 100,
        stock_quantity: 10
      });
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to create merchandise');
    });
  });

  describe('PUT /api/rewards/merchandise/:merchandiseId', () => {
    it('should update merchandise successfully', async () => {
      const currentItem = { id: 1, name: 'T-Shirt', description: 'Old', cost_in_points: 100, stock_quantity: 10, is_available: true, category: 'general' };
      pool.query.mockResolvedValueOnce({ rows: [currentItem] }); // Select current

      const updatedItem = { ...currentItem, cost_in_points: 150 };
      pool.query.mockResolvedValueOnce({ rows: [updatedItem] }); // Update

      const res = await request(app).put('/api/rewards/merchandise/1').send({
        cost_in_points: 150
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Merchandise updated!');
      expect(res.body.item).toEqual(updatedItem);
    });

    it('should return 404 if merchandise not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).put('/api/rewards/merchandise/99').send({
        cost_in_points: 150
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Merchandise not found');
    });

    it('should handle db errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).put('/api/rewards/merchandise/1').send({
        cost_in_points: 150
      });
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toEqual('Failed to update merchandise');
    });
  });
});
