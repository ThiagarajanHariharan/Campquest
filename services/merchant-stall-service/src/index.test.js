const request = require('supertest');
const { app, server, pool } = require('./index');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Merchant Stall Service - POST /api/merchant/canteen/:canteenId/menu', () => {
  afterAll((done) => {
    server.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new menu item successfully (201)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Mock canteen found
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1, canteen_id: 1, name: 'Burger', description: 'Juicy', price: 5.99, calories: 500
        }
      ]
    }); // Mock insert

    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        name: 'Burger',
        description: 'Juicy',
        price: 5.99,
        calories: 500
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Menu item created!');
    expect(res.body.item.name).toBe('Burger');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        price: 5.99
      }); // missing name

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required fields: name, price');
  });

  it('should return 400 if price is negative', async () => {
    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        name: 'Burger',
        price: -5.99
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Price cannot be negative');
  });

  it('should return 404 if canteen is not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Mock canteen not found

    const res = await request(app)
      .post('/api/merchant/canteen/999/menu')
      .send({
        name: 'Burger',
        price: 5.99
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Canteen not found');
  });

  it('should return 500 if database query fails (missing error test)', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

    const res = await request(app)
      .post('/api/merchant/canteen/1/menu')
      .send({
        name: 'Burger',
        price: 5.99
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create menu item');
    expect(res.body.details).toBe('Database connection failed');
  });
});
