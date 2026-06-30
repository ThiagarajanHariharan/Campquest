## 2024-07-01 - Optimize Independent PostgreSQL Queries
**Learning:** Route handlers fetching multiple independent datasets for a validated resource often execute queries sequentially, which is a performance anti-pattern leading to longer response times.
**Action:** After awaiting necessary early-exit validation queries (e.g., checking user existence), wrap remaining independent queries in `Promise.all()` to execute them concurrently.
