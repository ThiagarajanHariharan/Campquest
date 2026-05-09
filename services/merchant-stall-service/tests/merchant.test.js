const request = require('supertest');

// Variables starting with "mock" are allowed in jest.mock()
const mockPool = {
  query: jest.fn(),
  end: jest.fn()
};
jest.mock('pg', () => {
  return { Pool: jest.fn(() => mockPool) };
});

const { app, server, pool } = require('../src/index');

describe('Merchant Stall API', () => {
  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return 200 and healthy status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    test('should return 503 if db check fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('unhealthy');
    });
  });

  describe('GET /api/merchant/canteens', () => {
    test('should list all canteens successfully', async () => {
      const mockRows = [
        { id: 1, name: 'Main Canteen', menu_item_count: '5' },
        { id: 2, name: 'North Canteen', menu_item_count: '3' }
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockRows });

      const res = await request(app).get('/api/merchant/canteens');
      expect(res.statusCode).toBe(200);
      expect(res.body.canteens).toEqual(mockRows);
      expect(res.body.count).toBe(2);
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/merchant/canteens');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch canteens');
    });
  });

  describe('GET /api/merchant/canteen/:canteenId/menu', () => {
    test('should return menu for a valid canteen', async () => {
      const canteenMock = { id: 1, name: 'Main Canteen' };
      const menuMock = [
        { id: 101, name: 'Chicken Rice', price: 5.5, is_available: true }
      ];

      // First query for canteen, second for menu
      mockPool.query
        .mockResolvedValueOnce({ rows: [canteenMock] })
        .mockResolvedValueOnce({ rows: menuMock });

      const res = await request(app).get('/api/merchant/canteen/1/menu');
      expect(res.statusCode).toBe(200);
      expect(res.body.canteen).toEqual(canteenMock);
      expect(res.body.menu).toEqual(menuMock);
      expect(res.body.item_count).toBe(1);
    });

    test('should return 404 if canteen not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Canteen not found

      const res = await request(app).get('/api/merchant/canteen/999/menu');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Canteen not found');
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/merchant/canteen/1/menu');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to fetch menu');
    });
  });

  describe('POST /api/merchant/canteen/:canteenId/menu', () => {
    test('should create a new menu item', async () => {
      const mockItem = { id: 102, name: 'Burger', price: 6.0 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // canteen exists
        .mockResolvedValueOnce({ rows: [mockItem] }); // insert successful

      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({ name: 'Burger', price: 6.0 });

      expect(res.statusCode).toBe(201);
      expect(res.body.item).toEqual(mockItem);
    });

    test('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({ name: 'Burger' }); // missing price

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Missing required fields/);
    });

    test('should return 400 if price is negative', async () => {
      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({ name: 'Burger', price: -5.0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Price cannot be negative');
    });

    test('should return 404 if canteen not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // canteen not found

      const res = await request(app)
        .post('/api/merchant/canteen/999/menu')
        .send({ name: 'Burger', price: 6.0 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Canteen not found');
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({ name: 'Burger', price: 6.0 });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/merchant/menu/:menuItemId', () => {
    test('should update an existing menu item', async () => {
      const currentItem = { id: 101, name: 'Chicken Rice', price: 5.0, description: 'Yummy' };
      const updatedItem = { ...currentItem, price: 5.5 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [currentItem] }) // check exists
        .mockResolvedValueOnce({ rows: [updatedItem] }); // update

      const res = await request(app)
        .put('/api/merchant/menu/101')
        .send({ price: 5.5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.item).toEqual(updatedItem);
    });

    test('should return 404 if menu item not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // not found

      const res = await request(app)
        .put('/api/merchant/menu/999')
        .send({ price: 5.5 });

      expect(res.statusCode).toBe(404);
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .put('/api/merchant/menu/101')
        .send({ price: 5.5 });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/merchant/menu/:menuItemId', () => {
    test('should soft delete a menu item', async () => {
      const deletedItem = { id: 101, is_available: false };

      mockPool.query.mockResolvedValueOnce({ rows: [deletedItem] });

      const res = await request(app).delete('/api/merchant/menu/101');

      expect(res.statusCode).toBe(200);
      expect(res.body.item).toEqual(deletedItem);
    });

    test('should return 404 if menu item not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete('/api/merchant/menu/999');

      expect(res.statusCode).toBe(404);
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).delete('/api/merchant/menu/101');

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/merchant/canteen/:canteenId/healthy', () => {
    test('should get healthy menu items', async () => {
      const healthyItems = [
        { id: 103, name: 'Salad', calories: 300 }
      ];

      mockPool.query.mockResolvedValueOnce({ rows: healthyItems });

      const res = await request(app).get('/api/merchant/canteen/1/healthy');

      expect(res.statusCode).toBe(200);
      expect(res.body.healthy_items).toEqual(healthyItems);
      expect(res.body.count).toBe(1);
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/merchant/canteen/1/healthy');

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/merchant/menu/:menuItemId', () => {
    test('should get a single menu item by ID', async () => {
      const itemMock = { id: 101, name: 'Chicken Rice', canteen_name: 'Main Canteen' };

      mockPool.query.mockResolvedValueOnce({ rows: [itemMock] });

      const res = await request(app).get('/api/merchant/menu/101');

      expect(res.statusCode).toBe(200);
      expect(res.body.item).toEqual(itemMock);
    });

    test('should return 404 if menu item not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/merchant/menu/999');

      expect(res.statusCode).toBe(404);
    });

    test('should return 500 on database error', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/merchant/menu/101');

      expect(res.statusCode).toBe(500);
    });
  });
});
