import React from 'react';

// ═══════════════════════════════════════════════════════════════
// Settings Drawer
// ═══════════════════════════════════════════════════════════════
export default function SettingsDrawer({ user, calorieGoal, onGoalChange, theme, onThemeToggle, notifications, onNotifToggle, onClose, onLogout }) {
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
