const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

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
  console.log(`[Merchant-Stall] ${req.method} ${req.path} - ${new Date().toISOString()}`);
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
      service: 'merchant-stall',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', service: 'merchant-stall', error: err.message });
  }
});

// ============================================================
// GET /api/merchant/canteens
// List all canteens
// ============================================================
app.get('/api/merchant/canteens', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(m.id) AS menu_item_count
       FROM canteens c
       LEFT JOIN menu_items m ON c.id = m.canteen_id AND m.is_available = true
       GROUP BY c.id ORDER BY c.name`
    );
    res.json({ canteens: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching canteens:', err);
    res.status(500).json({ error: 'Failed to fetch canteens', details: err.message });
  }
});

// ============================================================
// GET /api/merchant/canteen/:canteenId/menu
// Get all menu items for a specific canteen
// ============================================================
app.get('/api/merchant/canteen/:canteenId/menu', async (req, res) => {
  const { canteenId } = req.params;
  try {
    const canteenResult = await pool.query('SELECT * FROM canteens WHERE id = $1', [canteenId]);
    if (canteenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Canteen not found' });
    }

    const menuResult = await pool.query(
      `SELECT * FROM menu_items WHERE canteen_id = $1 AND is_available = true ORDER BY name`,
      [canteenId]
    );
    res.json({ canteen: canteenResult.rows[0], menu: menuResult.rows, item_count: menuResult.rows.length });
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu', details: err.message });
  }
});

// ============================================================
// POST /api/merchant/canteen/:canteenId/menu
// CREATE a new menu item (CRUD - Create)
// ============================================================
app.post('/api/merchant/canteen/:canteenId/menu', async (req, res) => {
  const { canteenId } = req.params;
  const { name, description, price, calories } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, price' });
  }
  if (price < 0) {
    return res.status(400).json({ error: 'Price cannot be negative' });
  }

  try {
    const canteenResult = await pool.query('SELECT id FROM canteens WHERE id = $1', [canteenId]);
    if (canteenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Canteen not found' });
    }

    const result = await pool.query(
      `INSERT INTO menu_items (canteen_id, name, description, price, calories)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [canteenId, name, description || null, price, calories || null]
    );
    res.status(201).json({ message: 'Menu item created!', item: result.rows[0] });
  } catch (err) {
    console.error('Error creating menu item:', err);
    res.status(500).json({ error: 'Failed to create menu item', details: err.message });
  }
});

// ============================================================
// PUT /api/merchant/menu/:menuItemId
// UPDATE an existing menu item (CRUD - Update)
// ============================================================
app.put('/api/merchant/menu/:menuItemId', async (req, res) => {
  const { menuItemId } = req.params;
  const { name, description, price, calories, is_available } = req.body;

  try {
    const current = await pool.query('SELECT * FROM menu_items WHERE id = $1', [menuItemId]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const item = current.rows[0];
    const result = await pool.query(
      `UPDATE menu_items SET
         name = $1, description = $2, price = $3, calories = $4, is_available = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        name !== undefined ? name : item.name,
        description !== undefined ? description : item.description,
        price !== undefined ? price : item.price,
        calories !== undefined ? calories : item.calories,
        is_available !== undefined ? is_available : item.is_available,
        menuItemId
      ]
    );
    res.json({ message: 'Menu item updated!', item: result.rows[0] });
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item', details: err.message });
  }
});

// ============================================================
// DELETE /api/merchant/menu/:menuItemId
// DELETE a menu item (CRUD - Delete / soft delete)
// ============================================================
app.delete('/api/merchant/menu/:menuItemId', async (req, res) => {
  const { menuItemId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE menu_items SET is_available = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [menuItemId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item removed from menu!', item: result.rows[0] });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item', details: err.message });
  }
});

// ============================================================
// GET /api/merchant/canteen/:canteenId/healthy
// Get healthy menu items (calories <= 600)
// ============================================================
app.get('/api/merchant/canteen/:canteenId/healthy', async (req, res) => {
  const { canteenId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM menu_items
       WHERE canteen_id = $1 AND is_available = true AND calories IS NOT NULL AND calories <= 600
       ORDER BY calories ASC`,
      [canteenId]
    );
    res.json({ healthy_items: result.rows, count: result.rows.length, max_calories: 600 });
  } catch (err) {
    console.error('Error fetching healthy items:', err);
    res.status(500).json({ error: 'Failed to fetch healthy items', details: err.message });
  }
});

// ============================================================
// GET /api/merchant/menu/:menuItemId
// Get a single menu item by ID (CRUD - Read)
// ============================================================
app.get('/api/merchant/menu/:menuItemId', async (req, res) => {
  const { menuItemId } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.*, c.name AS canteen_name FROM menu_items m
       JOIN canteens c ON m.canteen_id = c.id WHERE m.id = $1`,
      [menuItemId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ item: result.rows[0] });
  } catch (err) {
    console.error('Error fetching menu item:', err);
    res.status(500).json({ error: 'Failed to fetch menu item', details: err.message });
  }
});

// ============================================================
// Start Server
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`✅ Merchant-Stall Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, pool };
