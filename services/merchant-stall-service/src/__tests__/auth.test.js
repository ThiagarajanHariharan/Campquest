const request = require('supertest');
const { app, server, pool } = require('../index');

describe('Merchant Stall Authentication', () => {
  beforeAll(() => {
    process.env.MERCHANT_API_KEY = 'test-merchant-secret';
  });

  afterAll(async () => {
    // Close server and database pool
    server.close();
    await pool.end();
  });

  // Mock pool query so tests run without db dependencies
  beforeEach(() => {
    jest.spyOn(pool, 'query').mockImplementation((text, params) => {
      return Promise.resolve({ rows: [{ id: 1, name: 'Dummy Item' }] });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/merchant/canteen/:canteenId/menu', () => {
    it('should return 401 if authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({ name: 'Test', price: 10 });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('should return 401 if authorization token is invalid', async () => {
      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Test', price: 10 });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('should proceed if authorization token is valid', async () => {
      const validToken = process.env.MERCHANT_API_KEY;
      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test', price: 10 });
      expect(res.status).not.toBe(401); // Either 201 or other logic response
    });
  });

  describe('PUT /api/merchant/menu/:menuItemId', () => {
    it('should return 401 if authorization header is missing', async () => {
      const res = await request(app)
        .put('/api/merchant/menu/1')
        .send({ name: 'Test', price: 10 });
      expect(res.status).toBe(401);
    });

    it('should proceed if authorization token is valid', async () => {
      const validToken = process.env.MERCHANT_API_KEY;
      const res = await request(app)
        .put('/api/merchant/menu/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test', price: 10 });
      expect(res.status).not.toBe(401);
    });
  });

  describe('DELETE /api/merchant/menu/:menuItemId', () => {
    it('should return 401 if authorization header is missing', async () => {
      const res = await request(app)
        .delete('/api/merchant/menu/1');
      expect(res.status).toBe(401);
    });

    it('should proceed if authorization token is valid', async () => {
      const validToken = process.env.MERCHANT_API_KEY;
      const res = await request(app)
        .delete('/api/merchant/menu/1')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).not.toBe(401);
    });
  });
});
