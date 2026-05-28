import React, { useState, useEffect } from 'react';
import { FITNESS_URL, MERCHANT_URL, GEO_URL, REWARDS_URL } from '../constants';
import { api, getMealContext } from '../utils';
import CalorieRing from './CalorieRing';
import MealModal from './MealModal';
import FitnessModal from './FitnessModal';
import SettingsDrawer from './SettingsDrawer';

export default function StudentApp({ user, onLogout }) {
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
