const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Database Connection
// ============================================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'campusquest_db',
  user: process.env.DB_USER || 'campusquest_user',
  password: process.env.DB_PASSWORD || 'campusquest_pass',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[Fitness-Sync] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================================
// Health Check
// ============================================================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      service: 'fitness-sync',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'fitness-sync',
      error: err.message
    });
  }
});

// ============================================================
// POST /api/fitness/sync
// Sync a fitness activity and award quest points (1 mile = 10 pts)
// ============================================================
app.post('/api/fitness/sync', async (req, res) => {
  const { user_id, activity_type, distance_miles, calories_burned } = req.body;

  if (!user_id || !activity_type || distance_miles === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, activity_type, distance_miles'
    });
  }

  if (distance_miles <= 0) {
    return res.status(400).json({ error: 'distance_miles must be greater than 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate quest points: 1 mile = 10 points
    const points_earned = Math.round(distance_miles * 10);

    // Record the activity
    const activityResult = await client.query(
      `INSERT INTO fitness_activities (user_id, activity_type, distance_miles, calories_burned, points_earned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, activity_type, distance_miles, calories_burned || 0, points_earned]
    );

    // Add points to the user's quest_points balance
    const userResult = await client.query(
      `UPDATE users SET quest_points = quest_points + $1 WHERE id = $2 RETURNING id, username, quest_points`,
      [points_earned, user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Fitness activity synced successfully!',
      activity: activityResult.rows[0],
      points_earned,
      new_total_points: userResult.rows[0].quest_points,
      user: userResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error syncing fitness activity:', err);
    res.status(500).json({ error: 'Failed to sync fitness activity', details: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// GET /api/fitness/user/:userId
// Get a user's fitness data, activities, and quest points
// ============================================================
app.get('/api/fitness/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userResult = await pool.query(
      `SELECT id, username, email, quest_points, created_at FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activitiesResult = await pool.query(
      `SELECT * FROM fitness_activities WHERE user_id = $1 ORDER BY synced_at DESC LIMIT 20`,
      [userId]
    );

    const statsResult = await pool.query(
      `SELECT
         COUNT(*) AS total_activities,
         COALESCE(SUM(distance_miles), 0) AS total_miles,
         COALESCE(SUM(calories_burned), 0) AS total_calories,
         COALESCE(SUM(points_earned), 0) AS total_points_earned
       FROM fitness_activities WHERE user_id = $1`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      stats: statsResult.rows[0],
      recent_activities: activitiesResult.rows
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch user data', details: err.message });
  }
});

// ============================================================
// GET /api/fitness/leaderboard
// Get top 10 users ranked by quest points
// ============================================================
app.get('/api/fitness/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, quest_points,
              RANK() OVER (ORDER BY quest_points DESC) AS rank
       FROM users
       ORDER BY quest_points DESC
       LIMIT 10`
    );
    res.json({
      leaderboard: result.rows,
      total_players: result.rows.length,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: err.message });
  }
});

// ============================================================
// POST /api/fitness/user
// Create a new user account
// ============================================================
app.post('/api/fitness/user', async (req, res) => {
  const { username, email, password_hash } = req.body;

  if (!username || !email || !password_hash) {
    return res.status(400).json({ error: 'Missing required fields: username, email, password_hash' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, quest_points, created_at`,
      [username, email, password_hash]
    );
    res.status(201).json({ message: 'User created!', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// ============================================================
// GET /api/fitness/activities
// List all fitness activities (with optional user filter)
// ============================================================
app.get('/api/fitness/activities', async (req, res) => {
  const { user_id, limit = 50 } = req.query;
  try {
    let query = `SELECT fa.*, u.username FROM fitness_activities fa
                 JOIN users u ON fa.user_id = u.id`;
    const params = [];
    if (user_id) {
      query += ' WHERE fa.user_id = $1';
      params.push(user_id);
    }
    query += ' ORDER BY fa.synced_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ activities: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities', details: err.message });
  }
});

// ============================================================
// Start Server
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`✅ Fitness-Sync Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, pool };
