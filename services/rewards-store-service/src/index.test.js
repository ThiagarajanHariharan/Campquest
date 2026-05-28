const request = require('supertest');
const { app, server, pool } = require('./index');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('GET /api/rewards/merchandise', () => {
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and available merchandise', async () => {
    const mockMerchandise = [
      { id: 1, name: 'T-Shirt', cost_in_points: 100, is_available: true },
      { id: 2, name: 'Mug', cost_in_points: 50, is_available: true }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockMerchandise });

    const response = await request(app).get('/api/rewards/merchandise');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      merchandise: mockMerchandise,
      count: 2
    });
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM merchandise WHERE is_available = true ORDER BY cost_in_points ASC`
    );
  });

  it('should return 500 when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/api/rewards/merchandise');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to fetch merchandise',
      details: 'Database error'
    });
  });
});
