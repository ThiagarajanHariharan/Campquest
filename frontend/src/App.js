import React, { useState } from 'react';
import './App.css';

import LoginScreen from './components/LoginScreen';
import StallOwnerApp from './components/StallOwnerApp';
import StudentApp from './components/StudentApp';

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
