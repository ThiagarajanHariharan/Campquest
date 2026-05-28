const request = require('supertest');
const { app, server, pool } = require('./index');

describe('POST /api/merchant/canteen/:canteenId/menu Error Handling', () => {
  afterAll(async () => {
    server.close();
    await pool.end();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return 500 if database query fails during canteen check', async () => {
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        name: 'Burger',
        price: 5.99
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to create menu item',
      details: 'Database error'
    });
  });

  test('should return 500 if database query fails during insert', async () => {
    jest.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Canteen found
      .mockRejectedValueOnce(new Error('Database insert error')); // Insert fails

    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        name: 'Fries',
        price: 2.99
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to create menu item',
      details: 'Database insert error'
    });
  });
});
