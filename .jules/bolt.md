## 2024-07-02 - Parallelize Independent DB Queries
**Learning:** Executing independent PostgreSQL queries sequentially is a common performance anti-pattern that slows down route handlers.
**Action:** Wrap independent queries in a `Promise.all()` block to run them concurrently. However, always await validation queries (like early 404 checks) first to avoid unnecessary load.
