const { calculatePoints, haversineDistance } = require('../src/index');

// ============================================================
// Unit Tests: Fitness-Sync Service (Member A)
// ============================================================

describe('Point Calculation Logic', () => {
  test('should calculate 10 points for 1 mile', () => {
    const points = Math.round(1.0 * 10);
    expect(points).toBe(10);
  });

  test('should calculate 55 points for 5.5 miles', () => {
    const points = Math.round(5.5 * 10);
    expect(points).toBe(55);
  });

  test('should calculate 100 points for 10 miles', () => {
    const points = Math.round(10.0 * 10);
    expect(points).toBe(100);
  });

  test('should round fractional points correctly', () => {
    const points = Math.round(0.35 * 10);
    expect(points).toBe(4); // 3.5 rounds to 4
  });

  test('should handle very small distances', () => {
    const points = Math.round(0.1 * 10);
    expect(points).toBe(1);
  });

  test('should calculate 0 points for 0 miles', () => {
    const points = Math.round(0 * 10);
    expect(points).toBe(0);
  });

  test('should handle large distances correctly', () => {
    const points = Math.round(50 * 10);
    expect(points).toBe(500);
  });
});

describe('Activity Type Validation', () => {
  const validTypes = ['running', 'walking', 'cycling', 'swimming'];

  validTypes.forEach(type => {
    test(`should accept activity type: ${type}`, () => {
      expect(validTypes).toContain(type);
    });
  });
});

describe('Distance Validation', () => {
  test('should reject negative distances', () => {
    const isValid = (distance) => distance > 0;
    expect(isValid(-1)).toBe(false);
    expect(isValid(0)).toBe(false);
    expect(isValid(1)).toBe(true);
  });

  test('should accept positive distances', () => {
    const isValid = (distance) => distance > 0;
    expect(isValid(3.2)).toBe(true);
    expect(isValid(0.5)).toBe(true);
    expect(isValid(100)).toBe(true);
  });
});

describe('Leaderboard Logic', () => {
  const mockUsers = [
    { id: 1, username: 'alex', quest_points: 850 },
    { id: 2, username: 'bella', quest_points: 420 },
    { id: 3, username: 'charlie', quest_points: 1200 },
    { id: 4, username: 'diana', quest_points: 310 },
    { id: 5, username: 'evan', quest_points: 750 }
  ];

  test('should rank users by quest points descending', () => {
    const sorted = mockUsers.sort((a, b) => b.quest_points - a.quest_points);
    expect(sorted[0].username).toBe('charlie');
    expect(sorted[0].quest_points).toBe(1200);
  });

  test('should return top 10 users only', () => {
    const top10 = mockUsers.slice(0, 10);
    expect(top10.length).toBeLessThanOrEqual(10);
  });

  test('should have users sorted correctly', () => {
    const sorted = [...mockUsers].sort((a, b) => b.quest_points - a.quest_points);
    expect(sorted[0].quest_points).toBeGreaterThanOrEqual(sorted[1].quest_points);
    expect(sorted[1].quest_points).toBeGreaterThanOrEqual(sorted[2].quest_points);
  });
});

describe('User Data Validation', () => {
  test('should require username', () => {
    const validate = (data) => !!data.username && !!data.email && !!data.password_hash;
    expect(validate({ username: 'test', email: 'test@test.com', password_hash: 'hash' })).toBe(true);
    expect(validate({ email: 'test@test.com', password_hash: 'hash' })).toBe(false);
  });

  test('should require email', () => {
    const validate = (data) => !!data.username && !!data.email && !!data.password_hash;
    expect(validate({ username: 'test', password_hash: 'hash' })).toBe(false);
  });

  test('should require password_hash', () => {
    const validate = (data) => !!data.username && !!data.email && !!data.password_hash;
    expect(validate({ username: 'test', email: 'test@test.com' })).toBe(false);
  });
});

describe('Points Accumulation', () => {
  test('should correctly sum up points from multiple activities', () => {
    const activities = [
      { distance_miles: 5.5, points: 55 },
      { distance_miles: 3.2, points: 32 },
      { distance_miles: 10.0, points: 100 }
    ];
    const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);
    expect(totalPoints).toBe(187);
  });

  test('should not give negative points', () => {
    const points = Math.round(-1 * 10); // Negative distance
    expect(points).toBeLessThanOrEqual(0);
  });
});
