## 2024-06-15 - Concurrent DB Queries
**Learning:** Independent PostgreSQL queries in route handlers executed sequentially are a common performance anti-pattern in this architecture.
**Action:** Wrap independent queries in a `Promise.all()` block to run them concurrently, significantly reducing response latency.
