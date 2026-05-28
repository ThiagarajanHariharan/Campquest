const request = require('supertest');
const { app, pool } = require('../index');

// Mock the database pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Merchant Stall Service - GET /api/merchant/canteen/:canteenId/menu', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return 404 if the canteen does not exist', async () => {
    // Mock the query to return an empty array for the canteen lookup
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    const response = await request(app).get('/api/merchant/canteen/999/menu');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Canteen not found' });
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM canteens WHERE id = $1', ['999']);
  });
});
