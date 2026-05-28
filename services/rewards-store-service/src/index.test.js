const request = require('supertest');
const { app, pool } = require('./index');

// Mock pg pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Rewards Store Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return 200 and healthy status when DB is connected', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database', 'connected');
    });

    test('should return 503 and unhealthy status when DB connection fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('Connection error'));

      const response = await request(app).get('/health');
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('status', 'unhealthy');
      expect(response.body).toHaveProperty('error', 'Connection error');
    });
  });

  describe('GET /api/rewards/merchandise', () => {
    test('should return list of available merchandise', async () => {
      const mockMerchandise = [
        { id: 1, name: 'T-Shirt', is_available: true, cost_in_points: 100 },
        { id: 2, name: 'Mug', is_available: true, cost_in_points: 50 },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockMerchandise });

      const response = await request(app).get('/api/rewards/merchandise');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('merchandise');
      expect(response.body.merchandise).toEqual(mockMerchandise);
      expect(response.body).toHaveProperty('count', 2);
    });

    test('should handle database errors when fetching merchandise', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB Query Failed'));

      const response = await request(app).get('/api/rewards/merchandise');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch merchandise');
    });
  });

  describe('GET /api/rewards/merchandise/:merchandiseId', () => {
    test('should return single merchandise item when found', async () => {
      const mockItem = { id: 1, name: 'T-Shirt', cost_in_points: 100 };
      pool.query.mockResolvedValueOnce({ rows: [mockItem] });

      const response = await request(app).get('/api/rewards/merchandise/1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item).toEqual(mockItem);
    });

    test('should return 404 when merchandise item is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/rewards/merchandise/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Merchandise not found');
    });
  });

  describe('GET /api/rewards/user/:userId/balance', () => {
    test('should return user balance when user exists', async () => {
      const mockUser = { id: 1, username: 'testuser', quest_points: 500 };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app).get('/api/rewards/user/1/balance');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
      expect(response.body).toHaveProperty('balance', 500);
    });

    test('should return 404 when user is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/rewards/user/999/balance');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
});
