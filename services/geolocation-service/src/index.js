const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

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
  console.log(`[Geo-Location] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================================
// Haversine Formula - calculates distance in meters between two coordinates
// ============================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

const GEOFENCE_RADIUS_METERS = 50; // 50-meter radius

// ============================================================
// Health Check
// ============================================================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      service: 'geolocation',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      geofence_radius: `${GEOFENCE_RADIUS_METERS}m`,
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', service: 'geolocation', error: err.message });
  }
});

// ============================================================
// POST /api/geo/check-location
// Check user location against canteen coordinates (50m radius)
// ============================================================
app.post('/api/geo/check-location', async (req, res) => {
  const { user_id, latitude, longitude } = req.body;

  if (!user_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing required fields: user_id, latitude, longitude' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    // Fetch all open canteens
    const canteensResult = await pool.query(
      `SELECT * FROM canteens WHERE is_open = true`
    );

    // Find canteens within the 50m radius using Haversine
    const nearbyCanteens = [];
    for (const canteen of canteensResult.rows) {
      const distance = haversineDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(canteen.latitude),
        parseFloat(canteen.longitude)
      );

      if (distance <= GEOFENCE_RADIUS_METERS) {
        nearbyCanteens.push({ ...canteen, distance_meters: Math.round(distance) });
      }
    }

    // Log this location check
    const nearestCanteen = nearbyCanteens.length > 0
      ? nearbyCanteens.sort((a, b) => a.distance_meters - b.distance_meters)[0]
      : null;

    await pool.query(
      `INSERT INTO user_locations (user_id, latitude, longitude, nearby_canteen_id)
       VALUES ($1, $2, $3, $4)`,
      [user_id, latitude, longitude, nearestCanteen ? nearestCanteen.id : null]
    );

    if (nearbyCanteens.length === 0) {
      return res.json({
        within_range: false,
        message: 'You are not near any canteen. Walk closer to see the menu!',
        user_location: { latitude, longitude },
        geofence_radius: GEOFENCE_RADIUS_METERS,
        nearby_canteens: []
      });
    }

    // Fetch the menu for the nearest canteen
    const closestCanteen = nearbyCanteens.sort((a, b) => a.distance_meters - b.distance_meters)[0];
    const menuResult = await pool.query(
      `SELECT * FROM menu_items WHERE canteen_id = $1 AND is_available = true ORDER BY name`,
      [closestCanteen.id]
    );

    res.json({
      within_range: true,
      message: `You're near ${closestCanteen.name}! Here's the menu:`,
      user_location: { latitude, longitude },
      geofence_radius: GEOFENCE_RADIUS_METERS,
      nearest_canteen: closestCanteen,
      menu: menuResult.rows,
      all_nearby_canteens: nearbyCanteens
    });
  } catch (err) {
    console.error('Error checking location:', err);
    res.status(500).json({ error: 'Failed to check location', details: err.message });
  }
});

// ============================================================
// GET /api/geo/canteen/:canteenId/menu
// Get the menu for a specific canteen by ID
// ============================================================
app.get('/api/geo/canteen/:canteenId/menu', async (req, res) => {
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
    console.error('Error fetching canteen menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu', details: err.message });
  }
});

// ============================================================
// GET /api/geo/user/:userId/current-location
// Get the user's most recent location check
// ============================================================
app.get('/api/geo/user/:userId/current-location', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ul.*, c.name AS canteen_name
       FROM user_locations ul
       LEFT JOIN canteens c ON ul.nearby_canteen_id = c.id
       WHERE ul.user_id = $1
       ORDER BY ul.checked_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No location history found for this user' });
    }

    res.json({ location: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user location:', err);
    res.status(500).json({ error: 'Failed to fetch user location', details: err.message });
  }
});

// ============================================================
// GET /api/geo/canteens/all
// List all canteens on campus with their coordinates
// ============================================================
app.get('/api/geo/canteens/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(m.id) AS available_items
       FROM canteens c
       LEFT JOIN menu_items m ON c.id = m.canteen_id AND m.is_available = true
       GROUP BY c.id ORDER BY c.name`
    );
    res.json({
      canteens: result.rows,
      count: result.rows.length,
      geofence_radius: GEOFENCE_RADIUS_METERS
    });
  } catch (err) {
    console.error('Error fetching all canteens:', err);
    res.status(500).json({ error: 'Failed to fetch canteens', details: err.message });
  }
});

// ============================================================
// Start Server
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`✅ Geo-Location Service running on port ${PORT}`);
  console.log(`   Geofence radius: ${GEOFENCE_RADIUS_METERS}m`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, pool, haversineDistance };
