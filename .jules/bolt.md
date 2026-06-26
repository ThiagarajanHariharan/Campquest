## 2026-04-24 - Concurrent Independent Queries
**Learning:** Executing independent PostgreSQL queries sequentially in Express route handlers is a performance anti-pattern.
**Action:** Always optimize by wrapping independent queries in a `Promise.all()` block, ensuring validation queries (like existence checks) are awaited first to maintain early return logic.
