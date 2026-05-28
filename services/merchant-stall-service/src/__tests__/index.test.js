const request = require('supertest');

// Mock pg pool query
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require('pg');
const mPool = new Pool();
const { app, server, pool } = require('../index.js');

afterAll(async () => {
  await server.close();
  await pool.end();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/merchant/canteen/:canteenId/menu', () => {
  it('should return 404 for a non-existent canteen ID', async () => {
    // Mock the query to return empty rows for canteen search
    mPool.query.mockResolvedValueOnce({ rows: [] });

    const nonExistentId = 999999;
    const response = await request(app).get(`/api/merchant/canteen/${nonExistentId}/menu`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Canteen not found' });
    expect(mPool.query).toHaveBeenCalledWith('SELECT * FROM canteens WHERE id = $1', [String(nonExistentId)]);
  });

  it('should return 500 when database query fails', async () => {
    const error = new Error('Database connection failed');
    mPool.query.mockRejectedValueOnce(error);

    const canteenId = 1;
    const response = await request(app).get(`/api/merchant/canteen/${canteenId}/menu`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch menu', details: error.message });
  });

  it('should return canteen and its menu items when valid canteenId is provided', async () => {
    const canteenId = 1;
    const canteenData = { id: canteenId, name: 'Main Canteen' };
    const menuData = [
      { id: 1, canteen_id: canteenId, name: 'Burger', is_available: true },
      { id: 2, canteen_id: canteenId, name: 'Fries', is_available: true }
    ];

    mPool.query
      .mockResolvedValueOnce({ rows: [canteenData] }) // First query for canteen
      .mockResolvedValueOnce({ rows: menuData }); // Second query for menu items

    const response = await request(app).get(`/api/merchant/canteen/${canteenId}/menu`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      canteen: canteenData,
      menu: menuData,
      item_count: menuData.length
    });
    expect(mPool.query).toHaveBeenCalledTimes(2);
    expect(mPool.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM canteens WHERE id = $1', [String(canteenId)]);
    expect(mPool.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM menu_items WHERE canteen_id = $1 AND is_available = true ORDER BY name', [String(canteenId)]);
  });
});
