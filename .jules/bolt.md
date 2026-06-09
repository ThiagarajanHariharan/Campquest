## 2024-06-09 - Optimize DB queries in fitness-sync-service
**Learning:** Independent database queries within a single request handler (like fetching user activities and stats) shouldn't be awaited sequentially.
**Action:** Use `Promise.all()` to execute independent PostgreSQL queries concurrently to minimize total request latency and improve performance.
