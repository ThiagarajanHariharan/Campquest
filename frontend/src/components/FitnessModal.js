import React, { useState } from 'react';
import { api } from '../utils';
import { FITNESS_URL } from '../config';

// ═══════════════════════════════════════════════════════════════
// Fitness Sync Modal
// ═══════════════════════════════════════════════════════════════
export default function FitnessModal({ userId, onClose, onSync }) {
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
