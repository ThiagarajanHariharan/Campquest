const request = require('supertest');
const { app, server, pool, haversineDistance } = require('../src/index');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

beforeAll(() => {
  // Prevent Express from listening in test mode handled in the mock?
  // We actually don't want server to run in test normally but index.js starts it.
  // We can just silence console.log
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll((done) => {
  console.log.mockRestore();
  console.error.mockRestore();
  server.close(done);
});

describe('POST /api/geo/check-location', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  it('should return 500 when database query fails', async () => {
    // Mock the query to throw an error
    pool.query.mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app)
      .post('/api/geo/check-location')
      .send({
        user_id: 1,
        latitude: 40.7128,
        longitude: -74.0060,
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to check location',
      details: 'Database connection failed'
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM canteens WHERE is_open = true')
    );
  });
});
