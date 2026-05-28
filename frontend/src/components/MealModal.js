import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// Meal Log Modal
// ═══════════════════════════════════════════════════════════════
export default function MealModal({ meal, onClose, onLog }) {
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
