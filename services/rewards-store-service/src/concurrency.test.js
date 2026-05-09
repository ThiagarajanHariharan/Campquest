const request = require('supertest');
const { app, pool, server } = require('./index');

describe('Rewards Claim Concurrency', () => {
  let merchId;
  let testUserId;

  beforeAll(async () => {
    // Make sure we have a clean state for the merchandise item
    // Insert a test item with 1 stock, and cost 100
    const merchRes = await pool.query(`
      INSERT INTO merchandise (name, description, cost_in_points, stock_quantity, category)
      VALUES ('Test Item Concurrency', 'Limited edition item', 100, 1, 'general')
      RETURNING id
    `);
    merchId = merchRes.rows[0].id;

    // Create a user with enough points (200 points, enough to buy it twice if there was a bug)
    const userRes = await pool.query(`
      INSERT INTO users (username, email, password_hash, quest_points)
      VALUES ('concurrent_user_1', 'concurrent1@test.com', 'hash', 200)
      RETURNING id
    `);
    testUserId = userRes.rows[0].id;
  });

  afterAll(async () => {
    // cleanup
    if (testUserId) {
      await pool.query('DELETE FROM rewards_transactions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (merchId) {
      await pool.query('DELETE FROM merchandise WHERE id = $1', [merchId]);
    }

    server.close();
    await pool.end();
  });

  test('should handle concurrent claims for an item with stock 1 correctly', async () => {
    // We send two requests at the exact same time
    const req1 = request(app).post('/api/rewards/claim').send({
      user_id: testUserId,
      merchandise_id: merchId,
      quantity: 1
    });

    const req2 = request(app).post('/api/rewards/claim').send({
      user_id: testUserId,
      merchandise_id: merchId,
      quantity: 1
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    // One should succeed (201) and one should fail (400 - Insufficient stock)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    // Verify stock is exactly 0
    const merchCheck = await pool.query('SELECT stock_quantity FROM merchandise WHERE id = $1', [merchId]);
    expect(parseInt(merchCheck.rows[0].stock_quantity)).toBe(0);

    // Verify user points is exactly 100 (started with 200, bought 1 item for 100)
    const userCheck = await pool.query('SELECT quest_points FROM users WHERE id = $1', [testUserId]);
    expect(parseInt(userCheck.rows[0].quest_points)).toBe(100);

    // Verify exactly one transaction was created
    const txCheck = await pool.query('SELECT count(*) FROM rewards_transactions WHERE user_id = $1 AND merchandise_id = $2', [testUserId, merchId]);
    expect(parseInt(txCheck.rows[0].count)).toBe(1);
  });
});
