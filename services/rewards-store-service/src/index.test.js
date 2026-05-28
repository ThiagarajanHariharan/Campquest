const request = require('supertest');

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();

jest.mock('pg', () => {
  const mPool = {
    query: mockQuery,
    connect: mockConnect,
    on: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, server, pool } = require('./index');

describe('Rewards Store Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status when DB is connected', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'rewards-store');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return 503 and unhealthy status when DB is down', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('status', 'unhealthy');
      expect(response.body).toHaveProperty('error', 'Connection failed');
    });
  });

  describe('GET /api/rewards/merchandise', () => {
    it('should return a list of available merchandise', async () => {
      const mockMerchandise = [
        { id: 1, name: 'T-Shirt', cost_in_points: 100, is_available: true },
        { id: 2, name: 'Mug', cost_in_points: 50, is_available: true }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockMerchandise });

      const response = await request(app).get('/api/rewards/merchandise');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('merchandise');
      expect(response.body.merchandise).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM merchandise WHERE is_available = true'));
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).get('/api/rewards/merchandise');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/merchandise/:merchandiseId', () => {
    it('should return a specific merchandise item', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, is_available: true };
      mockQuery.mockResolvedValueOnce({ rows: [mockItem] });

      const response = await request(app).get('/api/rewards/merchandise/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.name).toBe('T-Shirt');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM merchandise WHERE id = $1'),
        ['1']
      );
    });

    it('should return 404 when merchandise is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/rewards/merchandise/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Merchandise not found');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).get('/api/rewards/merchandise/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/user/:userId/balance', () => {
    it('should return user balance', async () => {
      const mockUser = { id: 1, username: 'testuser', quest_points: 500 };
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app).get('/api/rewards/user/1/balance');

      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(500);
      expect(response.body.user.username).toBe('testuser');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, quest_points FROM users WHERE id = $1'),
        ['1']
      );
    });

    it('should return 404 when user is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/rewards/user/999/balance');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).get('/api/rewards/user/1/balance');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch balance');
    });
  });

  describe('GET /api/rewards/user/:userId/transactions', () => {
    it('should return user transactions', async () => {
      const mockTransactions = [
        { id: 1, merchandise_name: 'T-Shirt', points_spent: 100 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockTransactions });

      const response = await request(app).get('/api/rewards/user/1/transactions');

      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).get('/api/rewards/user/1/transactions');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch transactions');
    });
  });

  describe('POST /api/rewards/claim', () => {
    const mockClientQuery = jest.fn();

    beforeEach(() => {
      mockConnect.mockResolvedValue({
        query: mockClientQuery,
        release: mockRelease
      });
    });

    it('should return 400 if user_id or merchandise_id are missing', async () => {
      const response = await request(app).post('/api/rewards/claim').send({ user_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields: user_id, merchandise_id');
    });

    it('should return 400 if quantity is less than 1', async () => {
      const response = await request(app).post('/api/rewards/claim').send({ user_id: 1, merchandise_id: 1, quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Quantity must be at least 1');
    });

    it('should successfully claim merchandise', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };
      const mockUser = { id: 1, username: 'testuser', quest_points: 500 };
      const mockTransaction = { id: 1, points_spent: 100 };

      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockItem] }) // SELECT merchandise FOR UPDATE
        .mockResolvedValueOnce({ rows: [mockUser] }) // SELECT users FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ ...mockUser, quest_points: 400 }] }) // UPDATE users
        .mockResolvedValueOnce() // UPDATE merchandise
        .mockResolvedValueOnce({ rows: [mockTransaction] }) // INSERT transaction
        .mockResolvedValueOnce(); // COMMIT

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Successfully claimed 1x T-Shirt! 🎉');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.points_spent).toBe(100);
      expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should return 404 if merchandise is not found', async () => {
      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT merchandise FOR UPDATE

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Merchandise not found or unavailable');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should return 400 if stock is insufficient', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 0 };

      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockItem] }); // SELECT merchandise FOR UPDATE

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1,
        quantity: 1
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient stock');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should return 404 if user is not found', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };

      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockItem] }) // SELECT merchandise FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }); // SELECT users FOR UPDATE

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should return 400 if user has insufficient points', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };
      const mockUser = { id: 1, username: 'testuser', quest_points: 50 }; // Only 50 points

      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [mockItem] }) // SELECT merchandise FOR UPDATE
        .mockResolvedValueOnce({ rows: [mockUser] }); // SELECT users FOR UPDATE

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient quest points');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should handle errors during transaction gracefully', async () => {
      mockClientQuery
        .mockResolvedValueOnce() // BEGIN
        .mockRejectedValueOnce(new Error('DB Error')); // SELECT merchandise FOR UPDATE

      const response = await request(app).post('/api/rewards/claim').send({
        user_id: 1,
        merchandise_id: 1
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to claim merchandise');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('POST /api/rewards/merchandise', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app).post('/api/rewards/merchandise').send({ name: 'T-Shirt' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields: name, cost_in_points, stock_quantity');
    });

    it('should create new merchandise successfully', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100, stock_quantity: 10 };
      mockQuery.mockResolvedValueOnce({ rows: [mockItem] });

      const response = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt',
        cost_in_points: 100,
        stock_quantity: 10
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Merchandise created!');
      expect(response.body.item.name).toBe('T-Shirt');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).post('/api/rewards/merchandise').send({
        name: 'T-Shirt',
        cost_in_points: 100,
        stock_quantity: 10
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to create merchandise');
    });
  });

  describe('PUT /api/rewards/merchandise/:merchandiseId', () => {
    it('should return 404 if merchandise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Select current

      const response = await request(app).put('/api/rewards/merchandise/999').send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Merchandise not found');
    });

    it('should update merchandise successfully', async () => {
      const mockCurrentItem = { id: 1, name: 'Old Name', cost_in_points: 100, stock_quantity: 10 };
      const mockUpdatedItem = { ...mockCurrentItem, name: 'New Name' };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockCurrentItem] })
        .mockResolvedValueOnce({ rows: [mockUpdatedItem] });

      const response = await request(app).put('/api/rewards/merchandise/1').send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Merchandise updated!');
      expect(response.body.item.name).toBe('New Name');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB Error'));

      const response = await request(app).put('/api/rewards/merchandise/1').send({ name: 'New Name' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to update merchandise');
    });
  });
});
