## 2024-06-14 - Concurrent PostgreSQL Queries
**Learning:** Independent PostgreSQL queries executed sequentially cause a performance bottleneck by compounding database response latency. This is a common anti-pattern in the backend microservices.
**Action:** Always optimize route handlers by wrapping independent queries in a `Promise.all()` block to run them concurrently.
