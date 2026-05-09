const request = require('supertest');
const { app, pool } = require('../src/index');

describe('User API', () => {
  describe('POST /api/fitness/user', () => {
    const originalQuery = pool.query;

    afterEach(() => {
      pool.query = originalQuery;
    });

    test('should return 409 if username or email already exists', async () => {
      pool.query = jest.fn().mockRejectedValue({ code: '23505' });

      const response = await request(app)
        .post('/api/fitness/user')
        .send({
          username: 'duplicate',
          email: 'duplicate@test.com',
          password_hash: 'hash123'
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Username or email already exists' });
    });
  });
});
