const request = require('supertest');
const { Pool } = require('pg');

// Mock pg module
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { app, server, pool } = require('./index');

afterAll(() => {
  server.close();
});

describe('Scaffold test', () => {
  test('should load without errors', () => {
    expect(true).toBe(true);
  });
});

describe('GET /health', () => {
  test('should return healthy status when database is connected', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  test('should return unhealthy status when database connection fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection error'));

    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.error).toBe('Connection error');
  });
});

describe('GET /api/merchant/canteens', () => {
  test('should return list of canteens', async () => {
    const mockCanteens = [
      { id: 1, name: 'North Canteen', menu_item_count: '2' },
      { id: 2, name: 'South Canteen', menu_item_count: '0' }
    ];
    pool.query.mockResolvedValueOnce({ rows: mockCanteens });

    const res = await request(app).get('/api/merchant/canteens');
    expect(res.status).toBe(200);
    expect(res.body.canteens).toEqual(mockCanteens);
    expect(res.body.count).toBe(2);
  });

  test('should return 500 when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app).get('/api/merchant/canteens');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch canteens');
    expect(res.body.details).toBe('DB Error');
  });
});

describe('GET /api/merchant/canteen/:canteenId/menu', () => {
  test('should return menu for a specific canteen', async () => {
    const mockCanteen = { id: 1, name: 'North Canteen' };
    const mockMenu = [
      { id: 1, name: 'Noodles', price: 4.5, is_available: true },
      { id: 2, name: 'Rice', price: 3.5, is_available: true }
    ];

    // First query: select canteen
    pool.query.mockResolvedValueOnce({ rows: [mockCanteen] });
    // Second query: select menu
    pool.query.mockResolvedValueOnce({ rows: mockMenu });

    const res = await request(app).get('/api/merchant/canteen/1/menu');
    expect(res.status).toBe(200);
    expect(res.body.canteen).toEqual(mockCanteen);
    expect(res.body.menu).toEqual(mockMenu);
    expect(res.body.item_count).toBe(2);
  });

  test('should return 404 when canteen not found', async () => {
    // Return empty rows for canteen query
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/merchant/canteen/999/menu');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Canteen not found');
  });

  test('should return 500 when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app).get('/api/merchant/canteen/1/menu');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch menu');
  });
});

describe('POST /api/merchant/canteen/:canteenId/menu', () => {
  const newItem = {
    name: 'New Dish',
    description: 'Tasty',
    price: 5.5,
    calories: 400
  };

  test('should return 400 if name or price is missing', async () => {
    const res1 = await request(app).post('/api/merchant/canteen/1/menu').send({ price: 5.5 });
    expect(res1.status).toBe(400);
    expect(res1.body.error).toBe('Missing required fields: name, price');

    const res2 = await request(app).post('/api/merchant/canteen/1/menu').send({ name: 'Dish' });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toBe('Missing required fields: name, price');
  });

  test('should return 400 if price is negative', async () => {
    const res = await request(app).post('/api/merchant/canteen/1/menu').send({ name: 'Dish', price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Price cannot be negative');
  });

  test('should return 404 if canteen not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Canteen check

    const res = await request(app).post('/api/merchant/canteen/999/menu').send(newItem);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Canteen not found');
  });

  test('should create a new menu item', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Canteen check
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10, ...newItem }] }); // Insert

    const res = await request(app).post('/api/merchant/canteen/1/menu').send(newItem);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Menu item created!');
    expect(res.body.item.name).toBe('New Dish');
  });

  test('should return 500 when database query fails during creation', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Canteen check
    pool.query.mockRejectedValueOnce(new Error('Insert DB Error'));

    const res = await request(app).post('/api/merchant/canteen/1/menu').send(newItem);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create menu item');
  });
});

describe('PUT /api/merchant/menu/:menuItemId', () => {
  const updateData = {
    name: 'Updated Dish',
    price: 6.0,
    is_available: false
  };

  test('should return 404 if menu item not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Item check

    const res = await request(app).put('/api/merchant/menu/999').send(updateData);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Menu item not found');
  });

  test('should update an existing menu item', async () => {
    const existingItem = {
      id: 1, name: 'Old Dish', description: null, price: 5.0, calories: null, is_available: true
    };
    pool.query.mockResolvedValueOnce({ rows: [existingItem] }); // Item check
    pool.query.mockResolvedValueOnce({ rows: [{ ...existingItem, ...updateData }] }); // Update return

    const res = await request(app).put('/api/merchant/menu/1').send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Menu item updated!');
    expect(res.body.item.name).toBe('Updated Dish');
    expect(res.body.item.price).toBe(6.0);
    expect(res.body.item.is_available).toBe(false);
  });

  test('should return 500 when database query fails during update', async () => {
    pool.query.mockRejectedValueOnce(new Error('Update DB Error'));

    const res = await request(app).put('/api/merchant/menu/1').send(updateData);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update menu item');
  });
});

describe('DELETE /api/merchant/menu/:menuItemId', () => {
  test('should return 404 if menu item not found to delete', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Update return

    const res = await request(app).delete('/api/merchant/menu/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Menu item not found');
  });

  test('should soft-delete an existing menu item', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, is_available: false }] });

    const res = await request(app).delete('/api/merchant/menu/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Menu item removed from menu!');
    expect(res.body.item.is_available).toBe(false);
  });

  test('should return 500 when database query fails during delete', async () => {
    pool.query.mockRejectedValueOnce(new Error('Delete DB Error'));

    const res = await request(app).delete('/api/merchant/menu/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to delete menu item');
  });
});

describe('GET /api/merchant/canteen/:canteenId/healthy', () => {
  test('should return healthy items for a canteen', async () => {
    const mockItems = [
      { id: 1, name: 'Salad', calories: 200 }
    ];
    pool.query.mockResolvedValueOnce({ rows: mockItems });

    const res = await request(app).get('/api/merchant/canteen/1/healthy');
    expect(res.status).toBe(200);
    expect(res.body.healthy_items).toEqual(mockItems);
    expect(res.body.count).toBe(1);
    expect(res.body.max_calories).toBe(600);
  });

  test('should return 500 when database query fails for healthy items', async () => {
    pool.query.mockRejectedValueOnce(new Error('Healthy DB Error'));

    const res = await request(app).get('/api/merchant/canteen/1/healthy');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch healthy items');
  });
});

describe('GET /api/merchant/menu/:menuItemId', () => {
  test('should return a specific menu item', async () => {
    const mockItem = { id: 1, name: 'Burger', canteen_name: 'Fast Food' };
    pool.query.mockResolvedValueOnce({ rows: [mockItem] });

    const res = await request(app).get('/api/merchant/menu/1');
    expect(res.status).toBe(200);
    expect(res.body.item).toEqual(mockItem);
  });

  test('should return 404 if specific menu item not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/merchant/menu/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Menu item not found');
  });

  test('should return 500 when database query fails for specific item', async () => {
    pool.query.mockRejectedValueOnce(new Error('Specific Item DB Error'));

    const res = await request(app).get('/api/merchant/menu/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch menu item');
  });
});
