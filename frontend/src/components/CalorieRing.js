import React from 'react';

export default function CalorieRing({ ingested, burned, goal }) {
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
