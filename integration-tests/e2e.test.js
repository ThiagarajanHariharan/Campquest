const axios = require('axios');

const FITNESS_URL = process.env.FITNESS_URL || 'http://localhost:3001';
const MERCHANT_URL = process.env.MERCHANT_URL || 'http://localhost:3002';
const GEO_URL = process.env.GEO_URL || 'http://localhost:3003';
const REWARDS_URL = process.env.REWARDS_URL || 'http://localhost:3004';

// ============================================================
// Integration Tests: CampusQuest Go (Member C responsibility)
// ============================================================

describe('🏥 Health Checks - All Services', () => {
  test('Fitness-Sync service is healthy', async () => {
    const res = await axios.get(`${FITNESS_URL}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(res.data.service).toBe('fitness-sync');
  });

  test('Merchant-Stall service is healthy', async () => {
    const res = await axios.get(`${MERCHANT_URL}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(res.data.service).toBe('merchant-stall');
  });

  test('Geo-Location service is healthy', async () => {
    const res = await axios.get(`${GEO_URL}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(res.data.service).toBe('geolocation');
  });

  test('Rewards-Store service is healthy', async () => {
    const res = await axios.get(`${REWARDS_URL}/health`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(res.data.service).toBe('rewards-store');
  });
});

describe('🏃 Fitness-Sync Service Tests', () => {
  let createdUserId;

  test('should create a new user', async () => {
    const res = await axios.post(`${FITNESS_URL}/api/fitness/user`, {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@campus.edu`,
      password_hash: 'testhashvalue123'
    });
    expect(res.status).toBe(201);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.quest_points).toBe(0);
    createdUserId = res.data.user.id;
  });

  test('should sync fitness activity and award points (1 mile = 10 pts)', async () => {
    const res = await axios.post(`${FITNESS_URL}/api/fitness/sync`, {
      user_id: createdUserId || 1,
      activity_type: 'running',
      distance_miles: 5.0,
      calories_burned: 400
    });
    expect(res.status).toBe(201);
    expect(res.data.points_earned).toBe(50);
    expect(res.data.activity).toBeDefined();
  });

  test('should reject sync with missing fields', async () => {
    try {
      await axios.post(`${FITNESS_URL}/api/fitness/sync`, { user_id: 1 });
    } catch (err) {
      expect(err.response.status).toBe(400);
    }
  });

  test('should return leaderboard sorted by quest points', async () => {
    const res = await axios.get(`${FITNESS_URL}/api/fitness/leaderboard`);
    expect(res.status).toBe(200);
    expect(res.data.leaderboard).toBeInstanceOf(Array);
    if (res.data.leaderboard.length >= 2) {
      expect(res.data.leaderboard[0].quest_points).toBeGreaterThanOrEqual(res.data.leaderboard[1].quest_points);
    }
  });

  test('should return 404 for non-existent user', async () => {
    try {
      await axios.get(`${FITNESS_URL}/api/fitness/user/999999`);
    } catch (err) {
      expect(err.response.status).toBe(404);
    }
  });
});

describe('🍜 Merchant-Stall CRUD Tests', () => {
  let canteenId;
  let menuItemId;

  test('should list all canteens', async () => {
    const res = await axios.get(`${MERCHANT_URL}/api/merchant/canteens`);
    expect(res.status).toBe(200);
    expect(res.data.canteens).toBeInstanceOf(Array);
    expect(res.data.canteens.length).toBeGreaterThan(0);
    canteenId = res.data.canteens[0].id;
  });

  test('should get menu for a canteen', async () => {
    const res = await axios.get(`${MERCHANT_URL}/api/merchant/canteen/${canteenId}/menu`);
    expect(res.status).toBe(200);
    expect(res.data.menu).toBeInstanceOf(Array);
  });

  test('should CREATE a new menu item (CRUD - Create)', async () => {
    const res = await axios.post(`${MERCHANT_URL}/api/merchant/canteen/${canteenId}/menu`, {
      name: 'Test Dish',
      description: 'Automated test menu item',
      price: 4.50,
      calories: 500
    });
    expect(res.status).toBe(201);
    expect(res.data.item).toBeDefined();
    expect(res.data.item.name).toBe('Test Dish');
    menuItemId = res.data.item.id;
  });

  test('should READ a menu item (CRUD - Read)', async () => {
    const res = await axios.get(`${MERCHANT_URL}/api/merchant/menu/${menuItemId}`);
    expect(res.status).toBe(200);
    expect(res.data.item.id).toBe(menuItemId);
  });

  test('should UPDATE a menu item (CRUD - Update)', async () => {
    const res = await axios.put(`${MERCHANT_URL}/api/merchant/menu/${menuItemId}`, {
      name: 'Updated Test Dish',
      price: 5.00
    });
    expect(res.status).toBe(200);
    expect(res.data.item.name).toBe('Updated Test Dish');
    expect(parseFloat(res.data.item.price)).toBe(5.00);
  });

  test('should get healthy items (calories <= 600)', async () => {
    const res = await axios.get(`${MERCHANT_URL}/api/merchant/canteen/${canteenId}/healthy`);
    expect(res.status).toBe(200);
    res.data.healthy_items.forEach(item => {
      expect(item.calories).toBeLessThanOrEqual(600);
    });
  });

  test('should DELETE/hide a menu item (CRUD - Delete)', async () => {
    const res = await axios.delete(`${MERCHANT_URL}/api/merchant/menu/${menuItemId}`);
    expect(res.status).toBe(200);
    expect(res.data.item.is_available).toBe(false);
  });
});

describe('📍 Geo-Location Tests', () => {
  test('should list all canteens with coordinates', async () => {
    const res = await axios.get(`${GEO_URL}/api/geo/canteens/all`);
    expect(res.status).toBe(200);
    expect(res.data.canteens).toBeInstanceOf(Array);
    expect(res.data.geofence_radius).toBe(50);
  });

  test('should detect when user is NOT within 50m radius', async () => {
    const res = await axios.post(`${GEO_URL}/api/geo/check-location`, {
      user_id: 1,
      latitude: 1.2800, // Far from canteen
      longitude: 103.8000
    });
    expect(res.status).toBe(200);
    expect(res.data.within_range).toBe(false);
    expect(res.data.nearby_canteens).toHaveLength(0);
  });

  test('should detect when user IS within 50m radius', async () => {
    // Use exact canteen coordinates (should be within 50m of itself)
    const res = await axios.post(`${GEO_URL}/api/geo/check-location`, {
      user_id: 1,
      latitude: 1.3429, // Exact canteen latitude from init.sql
      longitude: 103.6818
    });
    expect(res.status).toBe(200);
    expect(res.data.within_range).toBe(true);
    expect(res.data.menu).toBeDefined();
  });

  test('should reject invalid coordinates', async () => {
    try {
      await axios.post(`${GEO_URL}/api/geo/check-location`, {
        user_id: 1,
        latitude: 200, // Invalid!
        longitude: 103.6818
      });
    } catch (err) {
      expect(err.response.status).toBe(400);
    }
  });
});

describe('🎁 Rewards-Store Tests', () => {
  test('should list all merchandise', async () => {
    const res = await axios.get(`${REWARDS_URL}/api/rewards/merchandise`);
    expect(res.status).toBe(200);
    expect(res.data.merchandise).toBeInstanceOf(Array);
    expect(res.data.merchandise.length).toBeGreaterThan(0);
  });

  test('should get user balance', async () => {
    const res = await axios.get(`${REWARDS_URL}/api/rewards/user/1/balance`);
    expect(res.status).toBe(200);
    expect(res.data.balance).toBeGreaterThanOrEqual(0);
  });

  test('should successfully claim merchandise with sufficient points', async () => {
    // First give user enough points
    await axios.post(`${FITNESS_URL}/api/fitness/sync`, {
      user_id: 1,
      activity_type: 'running',
      distance_miles: 200, // 2000 points
      calories_burned: 10000
    });

    // Find cheapest item
    const merch = await axios.get(`${REWARDS_URL}/api/rewards/merchandise`);
    const cheapest = merch.data.merchandise.sort((a, b) => a.cost_in_points - b.cost_in_points)[0];

    const res = await axios.post(`${REWARDS_URL}/api/rewards/claim`, {
      user_id: 1,
      merchandise_id: cheapest.id,
      quantity: 1
    });
    expect(res.status).toBe(201);
    expect(res.data.points_spent).toBe(cheapest.cost_in_points);
  });

  test('should fail claim when insufficient points', async () => {
    const newUser = await axios.post(`${FITNESS_URL}/api/fitness/user`, {
      username: `broke_user_${Date.now()}`,
      email: `broke_${Date.now()}@campus.edu`,
      password_hash: 'hash'
    });

    const merch = await axios.get(`${REWARDS_URL}/api/rewards/merchandise`);
    const expensive = merch.data.merchandise.sort((a, b) => b.cost_in_points - a.cost_in_points)[0];

    try {
      await axios.post(`${REWARDS_URL}/api/rewards/claim`, {
        user_id: newUser.data.user.id,
        merchandise_id: expensive.id,
        quantity: 1
      });
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toContain('Insufficient quest points');
    }
  });

  test('should get user transaction history', async () => {
    const res = await axios.get(`${REWARDS_URL}/api/rewards/user/1/transactions`);
    expect(res.status).toBe(200);
    expect(res.data.transactions).toBeInstanceOf(Array);
  });
});

describe('🔄 End-to-End User Journey', () => {
  test('Full journey: Create user → Sync fitness → Check location → Claim reward', async () => {
    // 1. Create user
    const userRes = await axios.post(`${FITNESS_URL}/api/fitness/user`, {
      username: `e2e_user_${Date.now()}`,
      email: `e2e_${Date.now()}@campus.edu`,
      password_hash: 'e2ehash'
    });
    const userId = userRes.data.user.id;

    // 2. Sync fitness activity
    const syncRes = await axios.post(`${FITNESS_URL}/api/fitness/sync`, {
      user_id: userId,
      activity_type: 'running',
      distance_miles: 80, // 800 points
      calories_burned: 5000
    });
    expect(syncRes.data.points_earned).toBe(800);

    // 3. Check location
    const geoRes = await axios.post(`${GEO_URL}/api/geo/check-location`, {
      user_id: userId,
      latitude: 1.3429,
      longitude: 103.6818
    });
    expect(geoRes.data.within_range).toBe(true);

    // 4. Check balance
    const balanceRes = await axios.get(`${REWARDS_URL}/api/rewards/user/${userId}/balance`);
    expect(balanceRes.data.balance).toBe(800);

    // 5. Claim a reward
    const merch = await axios.get(`${REWARDS_URL}/api/rewards/merchandise`);
    const affordable = merch.data.merchandise.find(m => m.cost_in_points <= 800);
    if (affordable) {
      const claimRes = await axios.post(`${REWARDS_URL}/api/rewards/claim`, {
        user_id: userId,
        merchandise_id: affordable.id,
        quantity: 1
      });
      expect(claimRes.status).toBe(201);
      expect(claimRes.data.remaining_points).toBe(800 - affordable.cost_in_points);
    }
  }, 30000);
});
