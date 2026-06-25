## 2026-06-25 - Concurrent Database Queries
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially, which accumulates network and execution latency.
**Action:** Always wrap independent queries in a `Promise.all()` block to run them concurrently, but ensure validation queries (like early 404 returns) are awaited first.
