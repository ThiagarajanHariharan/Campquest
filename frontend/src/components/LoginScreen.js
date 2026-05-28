import React, { useState } from 'react';
import { DEMO_USERS } from '../config';

export default function LoginScreen({ onLogin }) {
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
