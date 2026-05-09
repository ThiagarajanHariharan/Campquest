const request = require('supertest');
const { app, pool, server } = require('../src/index');

describe('Menu Items API', () => {
  afterAll(async () => {
    await pool.end();
    server.close();
  });

  describe('POST /api/merchant/canteen/:canteenId/menu', () => {
    it('should reject negative calories', async () => {
      const response = await request(app)
        .post('/api/merchant/canteen/1/menu')
        .send({
          name: 'Healthy Salad',
          price: 5.99,
          calories: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Calories cannot be negative');
    });
  });

  describe('PUT /api/merchant/menu/:menuItemId', () => {
    it('should reject negative calories on update', async () => {
      const response = await request(app)
        .put('/api/merchant/menu/1')
        .send({
          calories: -50
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Calories cannot be negative');
    });
  });
});
