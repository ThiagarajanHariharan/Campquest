const request = require('supertest');
const { app, server, pool } = require('./index');

describe('Rewards-Store Service', () => {
  afterAll(() => {
    // Close the server to prevent open handle errors
    server.close();
  });

  describe('GET /api/rewards/merchandise', () => {
    afterEach(() => {
      // Clear mocks after each test
      jest.clearAllMocks();
    });

    it('should return available merchandise and count', async () => {
      // Mock data
      const mockMerchandise = [
        { id: 1, name: 'Campus T-Shirt', cost_in_points: 50, is_available: true },
        { id: 2, name: 'Coffee Mug', cost_in_points: 20, is_available: true }
      ];

      // Spy on pool.query and provide a mock implementation
      const querySpy = jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: mockMerchandise
      });

      const response = await request(app).get('/api/rewards/merchandise');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        merchandise: mockMerchandise,
        count: mockMerchandise.length
      });

      // Verify query was called correctly
      expect(querySpy).toHaveBeenCalledTimes(1);
      expect(querySpy).toHaveBeenCalledWith(
        'SELECT * FROM merchandise WHERE is_available = true ORDER BY cost_in_points ASC'
      );
    });

    it('should handle database errors and return 500', async () => {
      const mockError = new Error('Database connection failed');

      const querySpy = jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

      const response = await request(app).get('/api/rewards/merchandise');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch merchandise',
        details: mockError.message
      });

      expect(querySpy).toHaveBeenCalledTimes(1);
    });
  });
});
