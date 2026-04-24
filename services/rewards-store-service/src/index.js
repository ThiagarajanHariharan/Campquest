const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

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
});

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[Rewards-Store] ${req.method} ${req.path} - ${new Date().toISOString()}`);
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
      service: 'rewards-store',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', service: 'rewards-store', error: err.message });
  }
});

// ============================================================
// GET /api/rewards/merchandise
// Get all available merchandise
// ============================================================
app.get('/api/rewards/merchandise', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM merchandise WHERE is_available = true ORDER BY cost_in_points ASC`
    );
    res.json({ merchandise: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching merchandise:', err);
    res.status(500).json({ error: 'Failed to fetch merchandise', details: err.message });
  }
});

// ============================================================
// GET /api/rewards/merchandise/:merchandiseId
// Get a single merchandise item
// ============================================================
app.get('/api/rewards/merchandise/:merchandiseId', async (req, res) => {
  const { merchandiseId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM merchandise WHERE id = $1`,
      [merchandiseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Merchandise not found' });
    }
    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error('Error fetching merchandise item:', err);
    res.status(500).json({ error: 'Failed to fetch merchandise', details: err.message });
  }
});

// ============================================================
// GET /api/rewards/user/:userId/balance
// Get user quest points balance
// ============================================================
app.get('/api/rewards/user/:userId/balance', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, username, quest_points FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0], balance: result.rows[0].quest_points });
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ error: 'Failed to fetch balance', details: err.message });
  }
});

// ============================================================
// GET /api/rewards/user/:userId/transactions
// Get user's transaction history
// ============================================================
app.get('/api/rewards/user/:userId/transactions', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT rt.*, m.name AS merchandise_name, m.description AS merchandise_description
       FROM rewards_transactions rt
       JOIN merchandise m ON rt.merchandise_id = m.id
       WHERE rt.user_id = $1
       ORDER BY rt.created_at DESC`,
      [userId]
    );
    res.json({ transactions: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
});

// ============================================================
// POST /api/rewards/claim
// Claim merchandise using quest points (transaction-safe!)
// ============================================================
app.post('/api/rewards/claim', async (req, res) => {
  const { user_id, merchandise_id, quantity = 1 } = req.body;

  if (!user_id || !merchandise_id) {
    return res.status(400).json({ error: 'Missing required fields: user_id, merchandise_id' });
  }
  if (quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock merchandise row to prevent race conditions
    const merchResult = await client.query(
      `SELECT * FROM merchandise WHERE id = $1 AND is_available = true FOR UPDATE`,
      [merchandise_id]
    );

    if (merchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Merchandise not found or unavailable' });
    }

    const item = merchResult.rows[0];
    const totalCost = item.cost_in_points * quantity;

    // Check stock
    if (item.stock_quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient stock',
        available: item.stock_quantity,
        requested: quantity
      });
    }

    // Lock user row to prevent race conditions on points
    const userResult = await client.query(
      `SELECT id, username, quest_points FROM users WHERE id = $1 FOR UPDATE`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check user has enough points
    if (user.quest_points < totalCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient quest points',
        required: totalCost,
        available: user.quest_points,
        shortfall: totalCost - user.quest_points
      });
    }

    // Deduct points from user
    const updatedUserResult = await client.query(
      `UPDATE users SET quest_points = quest_points - $1 WHERE id = $2 RETURNING id, username, quest_points`,
      [totalCost, user_id]
    );

    // Reduce merchandise stock
    await client.query(
      `UPDATE merchandise SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2`,
      [quantity, merchandise_id]
    );

    // Record the transaction
    const transactionResult = await client.query(
      `INSERT INTO rewards_transactions (user_id, merchandise_id, quantity, points_spent, status)
       VALUES ($1, $2, $3, $4, 'completed') RETURNING *`,
      [user_id, merchandise_id, quantity, totalCost]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: `Successfully claimed ${quantity}x ${item.name}! 🎉`,
      transaction: transactionResult.rows[0],
      item_claimed: item,
      points_spent: totalCost,
      remaining_points: updatedUserResult.rows[0].quest_points
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error claiming merchandise:', err);
    res.status(500).json({ error: 'Failed to claim merchandise', details: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// POST /api/rewards/merchandise
// Add new merchandise (admin)
// ============================================================
app.post('/api/rewards/merchandise', async (req, res) => {
  const { name, description, cost_in_points, stock_quantity, category } = req.body;

  if (!name || cost_in_points === undefined || stock_quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, cost_in_points, stock_quantity' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO merchandise (name, description, cost_in_points, stock_quantity, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description || null, cost_in_points, stock_quantity, category || 'general']
    );
    res.status(201).json({ message: 'Merchandise created!', item: result.rows[0] });
  } catch (err) {
    console.error('Error creating merchandise:', err);
    res.status(500).json({ error: 'Failed to create merchandise', details: err.message });
  }
});

// ============================================================
// PUT /api/rewards/merchandise/:merchandiseId
// Update merchandise details
// ============================================================
app.put('/api/rewards/merchandise/:merchandiseId', async (req, res) => {
  const { merchandiseId } = req.params;
  const { name, description, cost_in_points, stock_quantity, is_available, category } = req.body;

  try {
    const current = await pool.query('SELECT * FROM merchandise WHERE id = $1', [merchandiseId]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Merchandise not found' });
    }

    const item = current.rows[0];
    const result = await pool.query(
      `UPDATE merchandise SET
         name = $1, description = $2, cost_in_points = $3, stock_quantity = $4,
         is_available = $5, category = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        name !== undefined ? name : item.name,
        description !== undefined ? description : item.description,
        cost_in_points !== undefined ? cost_in_points : item.cost_in_points,
        stock_quantity !== undefined ? stock_quantity : item.stock_quantity,
        is_available !== undefined ? is_available : item.is_available,
        category !== undefined ? category : item.category,
        merchandiseId
      ]
    );
    res.json({ message: 'Merchandise updated!', item: result.rows[0] });
  } catch (err) {
    console.error('Error updating merchandise:', err);
    res.status(500).json({ error: 'Failed to update merchandise', details: err.message });
  }
});

// ============================================================
// Start Server
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`✅ Rewards-Store Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, pool };
