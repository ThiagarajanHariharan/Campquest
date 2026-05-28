// ─── Time-aware meal context ─────────────────────────────────
export function getMealContext() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return { label: 'Log Breakfast', emoji: '🍳', color: '#f59e0b', period: 'morning'   };
  if (h >= 11 && h < 15) return { label: 'Log Lunch',     emoji: '🍜', color: '#10b981', period: 'afternoon' };
  if (h >= 15 && h < 20) return { label: 'Log Dinner',    emoji: '🍽️', color: '#6c63ff', period: 'evening'   };
  return                         { label: 'Log Snack',     emoji: '🌙', color: '#8b5cf6', period: 'night'     };
}

// ─── API helper ───────────────────────────────────────────────
export async function api(url, opts = {}) {
  try {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    return await r.json();
  } catch { return { error: 'Service unreachable' }; }
}
