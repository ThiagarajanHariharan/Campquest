const request = require('supertest');
const { app, server, pool } = require('./index');

describe('Rewards Store Service - RBAC', () => {
  afterAll(async () => {
    // Close the server and DB pool to prevent open handles
    server.close();
    await pool.end();
  });

  describe('POST /api/rewards/merchandise', () => {
    it('should reject unauthenticated requests with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/rewards/merchandise')
        .send({
          name: 'Hacked Item',
          cost_in_points: 0,
          stock_quantity: 100
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('should allow requests with x-role: admin header', async () => {
      // Create a transaction since this is hitting the real DB logic
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Mock the pool.query in the route handler so we don't actually write to DB during this test
        const originalQuery = pool.query;
        pool.query = jest.fn().mockResolvedValue({
          rows: [{
            id: 999,
            name: 'Admin Item',
            description: null,
            cost_in_points: 100,
            stock_quantity: 10,
            category: 'general'
          }]
        });

        const res = await request(app)
          .post('/api/rewards/merchandise')
          .set('x-role', 'admin')
          .send({
            name: 'Admin Item',
            cost_in_points: 100,
            stock_quantity: 10
          });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Merchandise created!');

        // Restore mock
        pool.query = originalQuery;
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  });

  describe('PUT /api/rewards/merchandise/:merchandiseId', () => {
    it('should reject unauthenticated requests with 403 Forbidden', async () => {
      const res = await request(app)
        .put('/api/rewards/merchandise/1')
        .send({
          cost_in_points: 0
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('should allow requests with x-role: admin header', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const originalQuery = pool.query;
        // Mock the initial SELECT and the UPDATE
        pool.query = jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Existing Item', cost_in_points: 50, stock_quantity: 5 }] }) // SELECT
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Existing Item', cost_in_points: 0, stock_quantity: 5 }] }); // UPDATE

        const res = await request(app)
          .put('/api/rewards/merchandise/1')
          .set('x-role', 'admin')
          .send({
            cost_in_points: 0
          });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Merchandise updated!');

        pool.query = originalQuery;
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  });
});