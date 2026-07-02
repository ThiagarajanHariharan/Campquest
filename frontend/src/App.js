import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ─── Service URLs ────────────────────────────────────────────
const FITNESS_URL  = process.env.REACT_APP_FITNESS_URL  || 'http://localhost:3001';
const MERCHANT_URL = process.env.REACT_APP_MERCHANT_URL || 'http://localhost:3002';
const GEO_URL      = process.env.REACT_APP_GEO_URL      || 'http://localhost:3003';
const REWARDS_URL  = process.env.REACT_APP_REWARDS_URL  || 'http://localhost:3004';

// ─── Demo Users (RBAC) ───────────────────────────────────────
const DEMO_USERS = [
  { id: 1, username: 'student_alex',  name: 'Alex',  role: 'student',     password: 'student123' },
  { id: 2, username: 'student_hari',  name: 'Hari',  role: 'student',     password: 'student123' },
  { id: 3, username: 'student_bella', name: 'Bella', role: 'student',     password: 'student123' },
  { id: 4, username: 'stall_owner',   name: 'Mary',  role: 'stall_owner', password: 'owner123'   },
];

// ─── Time-aware meal context ─────────────────────────────────
function getMealContext() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return { label: 'Log Breakfast', emoji: '🍳', color: '#f59e0b', period: 'morning'   };
  if (h >= 11 && h < 15) return { label: 'Log Lunch',     emoji: '🍜', color: '#10b981', period: 'afternoon' };
  if (h >= 15 && h < 20) return { label: 'Log Dinner',    emoji: '🍽️', color: '#6c63ff', period: 'evening'   };
  return                         { label: 'Log Snack',     emoji: '🌙', color: '#8b5cf6', period: 'night'     };
}

// ─── API helper ───────────────────────────────────────────────
async function api(url, opts = {}) {
  try {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    return await r.json();
  } catch { return { error: 'Service unreachable' }; }
}

// ═══════════════════════════════════════════════════════════════
// SVG Calorie Ring
// ═══════════════════════════════════════════════════════════════
function CalorieRing({ ingested, burned, goal }) {
  const R  = 78;
  const C  = 2 * Math.PI * R;
  const inPct  = Math.min(ingested / goal, 1);
  const burPct = Math.min(burned  / goal, 1);
  const remaining  = Math.max(goal - ingested, 0);
  const netBurned  = Math.max(burned - ingested, 0);
  const bonusActive = burned > ingested;

  return (
    <div className="ring-wrap">
      <svg width="210" height="210" viewBox="0 0 210 210">
        {/* Track */}
        <circle cx="105" cy="105" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="20"/>
        {/* Ingested (red-orange) */}
        <circle cx="105" cy="105" r={R} fill="none"
          stroke="#ff6b6b" strokeWidth="20" strokeLinecap="round"
          strokeDasharray={`${inPct * C} ${C}`}
          transform="rotate(-90 105 105)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
        {/* Burned (teal) — inner ring */}
        <circle cx="105" cy="105" r={R - 13} fill="none"
          stroke="#00d4aa" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${burPct * (2 * Math.PI * (R-13))} ${2 * Math.PI * (R-13)}`}
          transform="rotate(-90 105 105)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
        {/* Centre text */}
        <text x="105" y="93"  textAnchor="middle" fill="#fff"                  fontSize="30" fontWeight="800">{remaining}</text>
        <text x="105" y="112" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">cal remaining</text>
        {bonusActive && (
          <text x="105" y="130" textAnchor="middle" fill="#ffd700" fontSize="12" fontWeight="700">
            🔥 +{Math.round(netBurned / 10)} bonus pts!
          </text>
        )}
      </svg>
      {/* Legend */}
      <div className="ring-legend">
        <span className="leg-dot" style={{ background: '#ff6b6b' }}/><span>{ingested} eaten</span>
        <span className="leg-dot" style={{ background: '#00d4aa' }}/><span>{burned} burned</span>
        <span className="leg-dot" style={{ background: 'rgba(255,255,255,0.2)' }}/><span>{goal} goal</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Meal Log Modal
// ═══════════════════════════════════════════════════════════════
function MealModal({ meal, onClose, onLog }) {
  const [cal, setCal] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>{meal.emoji} {meal.label}</h3>
        <p className="modal-sub">What did you eat? Log your calories below.</p>
        <div className="form-group">
          <label>Description</label>
          <input placeholder="e.g. Chicken rice, Milo" value={desc} onChange={e => setDesc(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Calories (kcal)</label>
          <input type="number" placeholder="e.g. 600" value={cal} onChange={e => setCal(e.target.value)}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"
            style={{ background: meal.color }}
            onClick={() => { if (cal) { onLog(parseInt(cal), desc); onClose(); } }}>
            Log {meal.label.split(' ')[1]} {meal.emoji}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Fitness Sync Modal
// ═══════════════════════════════════════════════════════════════
function FitnessModal({ userId, onClose, onSync }) {
  const [form, setForm] = useState({ activity_type: 'running', distance_miles: '' });
  const handleSync = async () => {
    if (!form.distance_miles) return;
    const calories = Math.round(parseFloat(form.distance_miles) * 80);
    const data = await api(`${FITNESS_URL}/api/fitness/sync`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, ...form, distance_miles: parseFloat(form.distance_miles), calories_burned: calories })
    });
    if (data.points_earned) { onSync(data); onClose(); }
  };
  const pts = form.distance_miles ? Math.round(parseFloat(form.distance_miles) * 10) : 0;
  const cal = form.distance_miles ? Math.round(parseFloat(form.distance_miles) * 80) : 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>🏃 Log Activity</h3>
        <div className="form-group">
          <label>Activity</label>
          <select value={form.activity_type} onChange={e => setForm({...form, activity_type: e.target.value})}>
            <option value="running">🏃 Running</option>
            <option value="walking">🚶 Walking</option>
            <option value="cycling">🚴 Cycling</option>
            <option value="swimming">🏊 Swimming</option>
          </select>
        </div>
        <div className="form-group">
          <label>Distance (miles)</label>
          <input type="number" step="0.1" min="0.1" placeholder="e.g. 3.5"
            value={form.distance_miles} onChange={e => setForm({...form, distance_miles: e.target.value})}/>
        </div>
        {pts > 0 && (
          <div className="preview-box">
            <div>⭐ <strong>+{pts}</strong> Quest Points</div>
            <div>🔥 <strong>~{cal}</strong> cal burned</div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSync}>Sync Activity 🚀</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Settings Drawer
// ═══════════════════════════════════════════════════════════════
function SettingsDrawer({ user, calorieGoal, onGoalChange, theme, onThemeToggle, notifications, onNotifToggle, onClose, onLogout }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-header">
          <h3>⚙️ Settings</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-avatar">
          <div className="avatar-circle">{user.name[0].toUpperCase()}</div>
          <div>
            <p className="avatar-name">{user.name}</p>
            <span className="role-badge student">Student</span>
          </div>
        </div>
        <hr className="drawer-divider"/>
        {/* Calorie Goal */}
        <div className="drawer-section">
          <label className="drawer-label">🎯 Daily Calorie Goal</label>
          <div className="goal-row">
            <input type="number" className="goal-input" value={calorieGoal}
              onChange={e => onGoalChange(parseInt(e.target.value) || 2000)}/>
            <span>kcal</span>
          </div>
        </div>
        {/* Theme */}
        <div className="drawer-section">
          <label className="drawer-label">🎨 Theme</label>
          <div className="toggle-row">
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            <div className={`toggle ${theme === 'dark' ? 'on' : ''}`} onClick={onThemeToggle}>
              <div className="toggle-knob"/>
            </div>
          </div>
        </div>
        {/* Notifications */}
        <div className="drawer-section">
          <label className="drawer-label">🔔 Notifications</label>
          <div className="toggle-row">
            <span>{notifications ? 'Enabled' : 'Disabled'}</span>
            <div className={`toggle ${notifications ? 'on' : ''}`} onClick={onNotifToggle}>
              <div className="toggle-knob"/>
            </div>
          </div>
        </div>
        {/* Fitness API */}
        <div className="drawer-section">
          <label className="drawer-label">🏃 Fitness API</label>
          <div className="api-status">
            <span className="api-dot"/>
            <span>Connected to Fitness-Sync</span>
          </div>
          <p className="drawer-hint">Port 3001 · Activities synced automatically</p>
        </div>
        <div style={{ marginTop: 'auto', padding: '16px' }}>
          <button className="btn btn-logout" onClick={onLogout}>🚪 Log Out</button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stall Owner View (placeholder)
// ═══════════════════════════════════════════════════════════════
function StallOwnerApp({ user, onLogout }) {
  return (
    <div className="app">
      <header className="header" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
        <div className="header-content">
          <div className="logo"><span>🏪</span><h1>Stall Dashboard</h1></div>
          <button className="icon-btn" onClick={onLogout}>🚪</button>
        </div>
      </header>
      <main className="main" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: '4rem' }}>🏪</div>
        <h2>Welcome, {user.name}!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Stall Owner tools coming soon.<br/>Merchant dashboard in Phase 2.</p>
        <div className="coming-soon-card">
          <p>📋 Menu Management</p>
          <p>📊 Sales Analytics</p>
          <p>🔔 Order Notifications</p>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Login Screen
// ═══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = DEMO_USERS.find(u => u.username === username && u.password === password);
      if (u) { onLogin(u); }
      else    { setError('Invalid username or password'); setLoading(false); }
    }, 600);
  };

  const quickLogin = (u) => { setUsername(u.username); setPassword(u.password); };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏃</div>
        <h1 className="login-title">CampusQuest Go</h1>
        <p className="login-sub">Your campus fitness companion</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input placeholder="Enter your username" value={username} onChange={e => { setUsername(e.target.value); setError(''); }}/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}/>
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <div className="quick-login">
          <p className="ql-label">Quick demo login:</p>
          <div className="ql-grid">
            {DEMO_USERS.map(u => (
              <button key={u.username} className="ql-btn" onClick={() => quickLogin(u)}>
                <span>{u.role === 'student' ? '🎓' : '🏪'}</span>
                <span>{u.name}</span>
                <span className={`role-badge ${u.role}`}>{u.role === 'student' ? 'Student' : 'Stall'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Student App (main RBAC-protected view)
// ═══════════════════════════════════════════════════════════════
function StudentApp({ user, onLogout }) {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showMeal,     setShowMeal]     = useState(false);
  const [showFitness,  setShowFitness]  = useState(false);
  const [toast,        setToast]        = useState(null);
  const [calorieGoal,  setCalorieGoal]  = useState(() => parseInt(localStorage.getItem(`cg_${user.id}`)) || 2000);
  const [ingested,     setIngested]     = useState(() => parseInt(localStorage.getItem(`ing_${user.id}_${today()}`)) || 0);
  const [burned,       setBurned]       = useState(0);
  const [theme,        setTheme]        = useState(() => localStorage.getItem('theme') || 'dark');
  const [notifs,       setNotifs]       = useState(() => localStorage.getItem('notifs') !== 'off');
  const [userData,     setUserData]     = useState(null);
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [canteens,     setCanteens]     = useState([]);
  const [merchandise,  setMerchandise]  = useState([]);
  const meal = getMealContext();

  function today() { return new Date().toISOString().slice(0, 10); }

  // Load fitness data
  useEffect(() => {
    api(`${FITNESS_URL}/api/fitness/user/${user.id}`).then(d => {
      if (d.user) { setUserData(d); }
      if (d.stats?.total_calories) setBurned(parseInt(d.stats.total_calories) || 0);
    });
    api(`${FITNESS_URL}/api/fitness/leaderboard`).then(d => { if (d.leaderboard) setLeaderboard(d.leaderboard); });
    api(`${MERCHANT_URL}/api/merchant/canteens`).then(d => { if (d.canteens) setCanteens(d.canteens); });
    api(`${REWARDS_URL}/api/rewards/merchandise`).then(d => { if (d.merchandise) setMerchandise(d.merchandise); });
  }, [user.id]);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist calorie goal
  useEffect(() => { localStorage.setItem(`cg_${user.id}`, calorieGoal); }, [calorieGoal, user.id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMealLog = (cal, desc) => {
    const newTotal = ingested + cal;
    setIngested(newTotal);
    localStorage.setItem(`ing_${user.id}_${today()}`, newTotal);
    const burning = burned > newTotal;
    showToast(`${meal.emoji} Logged ${cal} cal${burning ? ' — burning more than eating! +bonus pts 🔥' : ''}!`);
  };

  const handleFitnessSync = (data) => {
    setBurned(b => b + (data.activity?.calories_burned || 0));
    setUserData(prev => prev ? { ...prev, user: { ...prev.user, quest_points: data.new_total_points } } : prev);
    showToast(`🏃 +${data.points_earned} Quest Points earned!`);
  };

  const claimReward = async (merchId) => {
    const data = await api(`${REWARDS_URL}/api/rewards/claim`, {
      method: 'POST', body: JSON.stringify({ user_id: user.id, merchandise_id: merchId, quantity: 1 })
    });
    if (data.message) { showToast(data.message); api(`${FITNESS_URL}/api/fitness/user/${user.id}`).then(d => { if (d.user) setUserData(d); }); }
    else showToast(data.error || 'Claim failed', 'error');
  };

  const questPoints  = userData?.user?.quest_points ?? 0;
  const totalMiles   = parseFloat(userData?.stats?.total_miles  || 0).toFixed(1);
  const totalActs    = userData?.stats?.total_activities ?? 0;
  const bonusPts     = burned > ingested ? Math.round((burned - ingested) / 10) : 0;
  const myRank       = leaderboard.find(u => u.id === user.id);

  return (
    <div className="app">
      {/* Toast */}
      {toast && <div className={`notification ${toast.type}`}>{toast.msg}</div>}

      {/* Modals */}
      {showMeal    && <MealModal meal={meal} onClose={() => setShowMeal(false)} onLog={handleMealLog}/>}
      {showFitness && <FitnessModal userId={user.id} onClose={() => setShowFitness(false)} onSync={handleFitnessSync}/>}

      {/* Settings Drawer */}
      {showSettings && (
        <SettingsDrawer
          user={user} calorieGoal={calorieGoal} onGoalChange={setCalorieGoal}
          theme={theme} onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          notifications={notifs} onNotifToggle={() => { setNotifs(n => !n); localStorage.setItem('notifs', notifs ? 'off' : 'on'); }}
          onClose={() => setShowSettings(false)} onLogout={onLogout}/>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button className="icon-btn" onClick={() => setShowSettings(true)}>☰</button>
          <div className="header-center">
            <span className="greeting">Greetings, {user.name}! 👋</span>
          </div>
          <div className="header-right">
            <span className="points-badge">⭐ {questPoints}</span>
            <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙️</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        {[
          { key: 'dashboard', icon: '📊', label: 'Dashboard' },
          { key: 'fitness',   icon: '🏃', label: 'Fitness'   },
          { key: 'location',  icon: '📍', label: 'Location'  },
          { key: 'rewards',   icon: '🎁', label: 'Rewards'   },
        ].map(t => (
          <button key={t.key} className={`nav-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'dashboard' && (
        <main className="main tab-content">
          {/* Calorie Ring */}
          <CalorieRing ingested={ingested} burned={burned} goal={calorieGoal}/>

          {/* Time-aware Meal Button */}
          <button className="meal-btn" style={{ background: meal.color }} onClick={() => setShowMeal(true)}>
            {meal.emoji} {meal.label}
          </button>

          {/* Activity Sync Button */}
          <button className="activity-btn" onClick={() => setShowFitness(true)}>
            🏃 Log Activity
          </button>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <p className="stat-val">{questPoints}</p>
              <p className="stat-label">Quest Pts</p>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🏃</span>
              <p className="stat-val">{totalMiles}</p>
              <p className="stat-label">Miles</p>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⚡</span>
              <p className="stat-val">{totalActs}</p>
              <p className="stat-label">Activities</p>
            </div>
          </div>

          {/* Bonus Points Banner */}
          {bonusPts > 0 && (
            <div className="bonus-banner">
              🔥 You've burned more than you ate today! Bonus <strong>+{bonusPts} pts</strong> unlocked!
            </div>
          )}

          {/* Leaderboard */}
          <h3 className="section-title">🏆 Leaderboard</h3>
          <div className="leaderboard">
            {leaderboard.map(u => (
              <div key={u.id} className={`leaderboard-row ${u.id === user.id ? 'mine' : ''} ${u.rank===1?'gold':u.rank===2?'silver':u.rank===3?'bronze':''}`}>
                <span className="rank">#{u.rank}</span>
                <span className="player">{u.username} {u.id === user.id && '(you)'}</span>
                <span className="points">⭐ {u.quest_points}</span>
              </div>
            ))}
          </div>
          {myRank && <p className="your-rank">You are ranked <strong>#{myRank.rank}</strong> 🎯</p>}
        </main>
      )}

      {/* ── FITNESS TAB ── */}
      {activeTab === 'fitness' && (
        <main className="main tab-content">
          <h2>🏃 Fitness History</h2>
          <p className="subtitle">Your personal activity log</p>
          <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={() => setShowFitness(true)}>
            + Log New Activity
          </button>
          {userData?.recent_activities?.length > 0 ? (
            <div className="activity-list">
              {userData.recent_activities.map(a => (
                <div key={a.id} className="activity-card">
                  <div className="act-icon">{a.activity_type === 'running' ? '🏃' : a.activity_type === 'cycling' ? '🚴' : a.activity_type === 'swimming' ? '🏊' : '🚶'}</div>
                  <div className="act-info">
                    <p className="act-type">{a.activity_type}</p>
                    <p className="act-details">{a.distance_miles} mi · {a.calories_burned} cal</p>
                    <p className="act-date">{new Date(a.synced_at).toLocaleDateString()}</p>
                  </div>
                  <div className="act-pts">+{a.points_earned} pts</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No activities yet. Log your first one! 🏃</div>
          )}
        </main>
      )}

      {/* ── LOCATION TAB ── */}
      {activeTab === 'location' && (
        <main className="main tab-content">
          <h2>📍 Campus Canteens</h2>
          <p className="subtitle">Walk within 50m of a canteen to unlock its menu</p>
          <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={async () => {
            if (!navigator.geolocation) return showToast('Geolocation not supported', 'error');
            navigator.geolocation.getCurrentPosition(async pos => {
              const d = await api(`${GEO_URL}/api/geo/check-location`, {
                method: 'POST', body: JSON.stringify({ user_id: user.id, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
              });
              showToast(d.message || 'Location checked', d.within_range ? 'success' : 'info');
            }, () => showToast('Location access denied', 'error'));
          }}>📍 Check My Location</button>
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
        </main>
      )}

      {/* ── REWARDS TAB ── */}
      {activeTab === 'rewards' && (
        <main className="main tab-content">
          <h2>🎁 Rewards Store</h2>
          <div className="balance-bar">
            <span>Your balance:</span>
            <strong>⭐ {questPoints} Quest Points</strong>
          </div>
          <div className="merch-grid">
            {merchandise.map(item => (
              <div key={item.id} className="merch-card">
                <div className="merch-icon">🛍️</div>
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <div className="merch-footer">
                  <span className="cost">⭐ {item.cost_in_points}</span>
                  <span className="stock">Stock: {item.stock_quantity}</span>
                </div>
                <button className="btn btn-primary" onClick={() => claimReward(item.id)}
                  disabled={questPoints < item.cost_in_points}>
                  {questPoints >= item.cost_in_points ? 'Claim 🎉' : 'Need more pts'}
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      <footer className="footer">🎓 CampusQuest Go · Republic Polytechnic 2026</footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Root App — RBAC Router
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cq_user')); } catch { return null; }
  });

  const handleLogin  = (u) => { localStorage.setItem('cq_user', JSON.stringify(u)); setCurrentUser(u); };
  const handleLogout = ()  => { localStorage.removeItem('cq_user'); setCurrentUser(null); };

  if (!currentUser)                          return <LoginScreen onLogin={handleLogin}/>;
  if (currentUser.role === 'stall_owner')    return <StallOwnerApp user={currentUser} onLogout={handleLogout}/>;
  return                                            <StudentApp    user={currentUser} onLogout={handleLogout}/>;
}
