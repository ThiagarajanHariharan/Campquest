const request = require('supertest');
const { app, pool, haversineDistance } = require('./index');

// Mock pg to avoid real DB connections
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Geo-Location Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // Utility Function Tests
  // ============================================================
  describe('haversineDistance', () => {
    test('should calculate distance between two same coordinates as 0', () => {
      const distance = haversineDistance(1.23, 4.56, 1.23, 4.56);
      expect(distance).toBe(0);
    });

    test('should return correct approximate distance for two known points', () => {
      // New York to London approx distances: lat/lon (40.7128, -74.0060) to (51.5074, -0.1278)
      // distance should be approx 5,570,000 meters
      const distance = haversineDistance(40.7128, -74.0060, 51.5074, -0.1278);
      expect(distance).toBeGreaterThan(5000000);
      expect(distance).toBeLessThan(6000000);
    });
  });

  // ============================================================
  // Endpoint Tests
  // ============================================================
  describe('GET /health', () => {
    test('should return 200 when database is healthy', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // mock healthy DB query

      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
    });

    test('should return 503 when database is unhealthy', async () => {
      pool.query.mockRejectedValueOnce(new Error('Connection error')); // mock failing DB query

      const response = await request(app).get('/health');
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toBe('Connection error');
    });
  });

  describe('POST /api/geo/check-location', () => {
    test('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/geo/check-location')
        .send({ latitude: 1.23, longitude: 4.56 }); // missing user_id
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Missing required fields/);
    });

    test('should return 400 on invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/geo/check-location')
        .send({ user_id: 1, latitude: 100, longitude: 200 }); // invalid lat/lon
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid coordinates');
    });

    test('should return 200 and not near canteen when no canteen within range', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, latitude: 40.0, longitude: -70.0 }] }); // canteensResult
      pool.query.mockResolvedValueOnce({}); // user_locations INSERT

      const response = await request(app)
        .post('/api/geo/check-location')
        .send({ user_id: 1, latitude: 1.0, longitude: 1.0 }); // very far coordinates

      expect(response.status).toBe(200);
      expect(response.body.within_range).toBe(false);
      expect(response.body.message).toMatch(/not near any canteen/);
    });

    test('should return 200 and return nearest canteen and menu when within 50m radius', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Canteen A', latitude: 1.0001, longitude: 1.0001 }] }); // canteensResult
      pool.query.mockResolvedValueOnce({}); // user_locations INSERT
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Burger', is_available: true }] }); // menuResult

      const response = await request(app)
        .post('/api/geo/check-location')
        .send({ user_id: 1, latitude: 1.0, longitude: 1.0 }); // very close coordinates

      expect(response.status).toBe(200);
      expect(response.body.within_range).toBe(true);
      expect(response.body.nearest_canteen.name).toBe('Canteen A');
      expect(response.body.menu.length).toBe(1);
      expect(response.body.menu[0].name).toBe('Burger');
    });

    test('should return 500 when database throws an error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app)
        .post('/api/geo/check-location')
        .send({ user_id: 1, latitude: 1.0, longitude: 1.0 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to check location');
    });
  });

  describe('GET /api/geo/canteen/:canteenId/menu', () => {
    test('should return 404 if canteen not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // canteenResult empty

      const response = await request(app).get('/api/geo/canteen/99/menu');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Canteen not found');
    });

    test('should return 200 with menu items for valid canteen', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Canteen A' }] }); // canteenResult
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Pizza' }] }); // menuResult

      const response = await request(app).get('/api/geo/canteen/1/menu');
      expect(response.status).toBe(200);
      expect(response.body.canteen.name).toBe('Canteen A');
      expect(response.body.menu.length).toBe(1);
      expect(response.body.item_count).toBe(1);
    });

    test('should return 500 when database throws an error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app).get('/api/geo/canteen/1/menu');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/geo/user/:userId/current-location', () => {
    test('should return 404 if no location history found for user', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // no location history

      const response = await request(app).get('/api/geo/user/1/current-location');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No location history found for this user');
    });

    test('should return 200 with location history', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1, latitude: 1.2, longitude: 3.4 }] }); // location history

      const response = await request(app).get('/api/geo/user/1/current-location');
      expect(response.status).toBe(200);
      expect(response.body.location.user_id).toBe(1);
      expect(response.body.location.latitude).toBe(1.2);
    });

    test('should return 500 when database throws an error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app).get('/api/geo/user/1/current-location');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/geo/canteens/all', () => {
    test('should return 200 with all canteens', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Canteen A' }, { id: 2, name: 'Canteen B' }] });

      const response = await request(app).get('/api/geo/canteens/all');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.canteens.length).toBe(2);
    });

    test('should return 500 when database throws an error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app).get('/api/geo/canteens/all');
      expect(response.status).toBe(500);
    });
  });
});
