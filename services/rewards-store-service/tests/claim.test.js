const request = require('supertest');
const { app, server, pool } = require('../src/index');

describe('Rewards Claim API', () => {
  afterAll(async () => {
    server.close();
    await pool.end();
  });

  describe('POST /api/rewards/claim', () => {
    it('should return 400 when quantity is 0', async () => {
      const response = await request(app)
        .post('/api/rewards/claim')
        .send({
          user_id: 1,
          merchandise_id: 1,
          quantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Quantity must be at least 1');
    });

    it('should return 400 when quantity is negative', async () => {
      const response = await request(app)
        .post('/api/rewards/claim')
        .send({
          user_id: 1,
          merchandise_id: 1,
          quantity: -5
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Quantity must be at least 1');
    });
  });
});
