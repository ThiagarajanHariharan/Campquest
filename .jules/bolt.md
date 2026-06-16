## 2024-06-16 - Sequential Database Queries
**Learning:** Backend microservices frequently exhibit an anti-pattern where independent PostgreSQL queries (e.g., fetching user activities and user stats separately) are awaited sequentially after validation.
**Action:** Wrap independent queries in a `Promise.all()` block to execute them concurrently, always ensuring that any validation queries (for early 404 returns) are awaited first to prevent unnecessary database load.
