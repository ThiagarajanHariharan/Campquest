import React, { useState, useEffect } from 'react';
import './App.css';

// Service URLs (update these for production)
const FITNESS_URL = process.env.REACT_APP_FITNESS_URL || 'http://localhost:3001';
const MERCHANT_URL = process.env.REACT_APP_MERCHANT_URL || 'http://localhost:3002';
const GEO_URL = process.env.REACT_APP_GEO_URL || 'http://localhost:3003';
const REWARDS_URL = process.env.REACT_APP_REWARDS_URL || 'http://localhost:3004';

const DEFAULT_USER_ID = 1;

// ============================================================
// API Helper
// ============================================================
async function apiCall(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    return await res.json();
  } catch (err) {
    return { error: `Failed to reach service: ${err.message}` };
  }
}

// ============================================================
// Main App Component
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serviceStatus, setServiceStatus] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [userData, setUserData] = useState(null);
  const [canteens, setCanteens] = useState([]);
  const [merchandise, setMerchandise] = useState([]);
  const [notification, setNotification] = useState(null);

  // Check all service health on load
  useEffect(() => {
    checkAllServices();
    loadDashboardData();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const checkAllServices = async () => {
    const services = [
      { name: 'Fitness-Sync', url: `${FITNESS_URL}/health` },
      { name: 'Merchant-Stall', url: `${MERCHANT_URL}/health` },
      { name: 'Geo-Location', url: `${GEO_URL}/health` },
      { name: 'Rewards-Store', url: `${REWARDS_URL}/health` }
    ];
    const statuses = {};
    await Promise.all(services.map(async (s) => {
      const data = await apiCall(s.url);
      statuses[s.name] = data.status === 'healthy';
    }));
    setServiceStatus(statuses);
  };

  const loadDashboardData = async () => {
    const [lb, user, merch] = await Promise.all([
      apiCall(`${FITNESS_URL}/api/fitness/leaderboard`),
      apiCall(`${FITNESS_URL}/api/fitness/user/${DEFAULT_USER_ID}`),
      apiCall(`${REWARDS_URL}/api/rewards/merchandise`)
    ]);
    if (lb.leaderboard) setLeaderboard(lb.leaderboard);
    if (user.user) setUserData(user);
    if (merch.merchandise) setMerchandise(merch.merchandise);
  };

  const loadCanteens = async () => {
    const data = await apiCall(`${MERCHANT_URL}/api/merchant/canteens`);
    if (data.canteens) setCanteens(data.canteens);
  };

  useEffect(() => {
    if (activeTab === 'merchant') loadCanteens();
    if (activeTab === 'rewards') loadDashboardData();
  }, [activeTab]);

  // ============================================================
  // Sync Fitness Activity
  // ============================================================
  const [fitnessForm, setFitnessForm] = useState({ activity_type: 'running', distance_miles: '' });
  const handleFitnessSync = async (e) => {
    e.preventDefault();
    const data = await apiCall(`${FITNESS_URL}/api/fitness/sync`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: DEFAULT_USER_ID,
        activity_type: fitnessForm.activity_type,
        distance_miles: parseFloat(fitnessForm.distance_miles),
        calories_burned: Math.round(parseFloat(fitnessForm.distance_miles) * 80)
      })
    });
    if (data.points_earned) {
      showNotification(`🎉 Synced! +${data.points_earned} Quest Points earned!`);
      loadDashboardData();
    } else {
      showNotification(data.error || 'Sync failed', 'error');
    }
  };

  // ============================================================
  // Check Location
  // ============================================================
  const checkLocation = async () => {
    if (!navigator.geolocation) {
      showNotification('Geolocation not supported', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const data = await apiCall(`${GEO_URL}/api/geo/check-location`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: DEFAULT_USER_ID,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
      });
      showNotification(data.message || 'Location checked!', data.within_range ? 'success' : 'info');
    }, () => {
      showNotification('Could not get location. Ensure location permission is granted.', 'error');
    });
  };

  // ============================================================
  // Claim Reward
  // ============================================================
  const claimReward = async (merchandiseId) => {
    const data = await apiCall(`${REWARDS_URL}/api/rewards/claim`, {
      method: 'POST',
      body: JSON.stringify({ user_id: DEFAULT_USER_ID, merchandise_id: merchandiseId, quantity: 1 })
    });
    if (data.message) {
      showNotification(data.message);
      loadDashboardData();
    } else {
      showNotification(data.error || 'Claim failed', 'error');
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="app">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏃</span>
            <h1>CampusQuest Go</h1>
          </div>
          {userData && (
            <div className="user-info">
              <span className="username">👤 {userData.user.username}</span>
              <span className="points-badge">⭐ {userData.user.quest_points} pts</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        {['dashboard', 'fitness', 'merchant', 'location', 'rewards'].map(tab => (
          <button
            key={tab}
            className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' && '📊'} {tab === 'fitness' && '🏃'} {tab === 'merchant' && '🍜'}
            {tab === 'location' && '📍'} {tab === 'rewards' && '🎁'}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main">

        {/* ---- DASHBOARD TAB ---- */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h2>📊 Dashboard</h2>
            <div className="service-grid">
              {Object.entries(serviceStatus).map(([name, healthy]) => (
                <div key={name} className={`service-card ${healthy ? 'healthy' : 'unhealthy'}`}>
                  <span className="service-indicator">{healthy ? '✅' : '❌'}</span>
                  <p>{name}</p>
                  <small>{healthy ? 'Online' : 'Offline'}</small>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={checkAllServices}>🔄 Refresh Status</button>
            <h3>🏆 Leaderboard</h3>
            <div className="leaderboard">
              {leaderboard.map((u) => (
                <div key={u.id} className={`leaderboard-row ${u.rank === 1 ? 'gold' : u.rank === 2 ? 'silver' : u.rank === 3 ? 'bronze' : ''}`}>
                  <span className="rank">#{u.rank}</span>
                  <span className="player">{u.username}</span>
                  <span className="points">⭐ {u.quest_points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- FITNESS TAB ---- */}
        {activeTab === 'fitness' && (
          <div className="tab-content">
            <h2>🏃 Fitness Sync</h2>
            <p className="subtitle">Sync your workout and earn Quest Points! (1 mile = 10 pts)</p>
            <form onSubmit={handleFitnessSync} className="form-card">
              <div className="form-group">
                <label>Activity Type</label>
                <select value={fitnessForm.activity_type} onChange={e => setFitnessForm({ ...fitnessForm, activity_type: e.target.value })}>
                  <option value="running">🏃 Running</option>
                  <option value="walking">🚶 Walking</option>
                  <option value="cycling">🚴 Cycling</option>
                  <option value="swimming">🏊 Swimming</option>
                </select>
              </div>
              <div className="form-group">
                <label>Distance (miles)</label>
                <input
                  type="number" step="0.1" min="0.1" required
                  placeholder="e.g. 3.5"
                  value={fitnessForm.distance_miles}
                  onChange={e => setFitnessForm({ ...fitnessForm, distance_miles: e.target.value })}
                />
              </div>
              {fitnessForm.distance_miles && (
                <div className="points-preview">
                  You'll earn: <strong>⭐ {Math.round(parseFloat(fitnessForm.distance_miles) * 10)} points</strong>
                </div>
              )}
              <button type="submit" className="btn btn-primary">Sync Activity 🚀</button>
            </form>
            {userData && (
              <div className="stats-grid">
                <div className="stat-card"><h4>Total Activities</h4><p>{userData.stats?.total_activities || 0}</p></div>
                <div className="stat-card"><h4>Total Miles</h4><p>{parseFloat(userData.stats?.total_miles || 0).toFixed(1)}</p></div>
                <div className="stat-card"><h4>Quest Points</h4><p>⭐ {userData.user.quest_points}</p></div>
              </div>
            )}
          </div>
        )}

        {/* ---- MERCHANT TAB ---- */}
        {activeTab === 'merchant' && (
          <div className="tab-content">
            <h2>🍜 Campus Canteens</h2>
            <div className="canteen-grid">
              {canteens.map(c => (
                <div key={c.id} className="canteen-card">
                  <h3>{c.name}</h3>
                  <p>📍 {c.location_name}</p>
                  <p>🍽️ {c.menu_item_count} items</p>
                  <span className={`status-badge ${c.is_open ? 'open' : 'closed'}`}>{c.is_open ? 'Open' : 'Closed'}</span>
                </div>
              ))}
            </div>
            {canteens.length === 0 && <p className="empty-state">No canteens found. Is the service running?</p>}
          </div>
        )}

        {/* ---- LOCATION TAB ---- */}
        {activeTab === 'location' && (
          <div className="tab-content">
            <h2>📍 Geo-Location</h2>
            <p className="subtitle">Check if you're within <strong>50 meters</strong> of a canteen to see its menu!</p>
            <div className="location-card">
              <div className="map-placeholder">🗺️</div>
              <p>Allow location access and tap below to check if you're near a canteen</p>
              <button className="btn btn-primary" onClick={checkLocation}>📍 Check My Location</button>
            </div>
            <h3>🏫 All Campus Canteens</h3>
            <div className="canteen-grid">
              {canteens.map(c => (
                <div key={c.id} className="canteen-card">
                  <h4>{c.name}</h4>
                  <p>Lat: {c.latitude}</p>
                  <p>Lon: {c.longitude}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- REWARDS TAB ---- */}
        {activeTab === 'rewards' && (
          <div className="tab-content">
            <h2>🎁 Rewards Store</h2>
            {userData && <p className="subtitle">Your balance: <strong>⭐ {userData.user.quest_points} Quest Points</strong></p>}
            <div className="merch-grid">
              {merchandise.map(item => (
                <div key={item.id} className="merch-card">
                  <div className="merch-icon">🛍️</div>
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <div className="merch-footer">
                    <span className="cost">⭐ {item.cost_in_points} pts</span>
                    <span className="stock">Stock: {item.stock_quantity}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => claimReward(item.id)}
                    disabled={!userData || userData.user.quest_points < item.cost_in_points}
                  >
                    {userData && userData.user.quest_points >= item.cost_in_points ? 'Claim! 🎉' : 'Not enough pts'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>🎓 CampusQuest Go | Republic Polytechnic Devops Project 2026</p>
      </footer>
    </div>
  );
}
