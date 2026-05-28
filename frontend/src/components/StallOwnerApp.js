import React from 'react';

// ═══════════════════════════════════════════════════════════════
// Stall Owner View (placeholder)
// ═══════════════════════════════════════════════════════════════
export default function StallOwnerApp({ user, onLogout }) {
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
