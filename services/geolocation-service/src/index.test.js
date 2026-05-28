const request = require('supertest');
const { app, server, pool } = require('./index');

describe('Geolocation Service API', () => {
  afterAll((done) => {
    server.close(() => {
      // End the pool after server closes
      pool.end(done);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/geo/check-location', () => {
    it('should return 500 when database query fails (error path)', async () => {
      // Suppress console.error output during this test
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the pool.query to throw an error
      jest.spyOn(pool, 'query').mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/geo/check-location')
        .send({
          user_id: 1,
          latitude: 1.290270,
          longitude: 103.851959
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to check location');
      expect(response.body).toHaveProperty('details', 'Database connection failed');

      expect(console.error).toHaveBeenCalledWith('Error checking location:', expect.any(Error));
    });
  });
});
