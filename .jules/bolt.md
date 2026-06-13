## 2026-06-13 - Parallelize independent queries
**Learning:** Sequential execution of independent PostgreSQL queries (e.g., fetching a user, their stats, and recent activities) is a common performance anti-pattern that increases response latency.
**Action:** Always wrap independent queries in `Promise.all()` to execute them concurrently.
