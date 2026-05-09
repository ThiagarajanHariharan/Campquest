const request = require('supertest');
const { app, pool } = require('../index');

describe('CORS Configuration', () => {
  afterAll(async () => {
    // Close the database pool so Jest can exit cleanly
    await pool.end();
  });

  it('should allow requests from the default allowed origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should omit access-control-allow-origin header or not allow requests from unauthorized origins', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
