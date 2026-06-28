## 2024-06-28 - Optimize Independent Queries with Promise.all
**Learning:** Executing independent PostgreSQL queries sequentially in Express route handlers is a common performance anti-pattern that increases response time.
**Action:** Always wrap independent, non-dependent queries in a `Promise.all()` block to run them concurrently, but ensure validation queries (like checking existence for a 404) are awaited first to avoid unnecessary database load.
