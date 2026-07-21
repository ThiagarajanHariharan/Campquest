## 2026-07-21 - Concurrent PostgreSQL queries
**Learning:** In backend Express microservices, optimize route handlers by wrapping independent PostgreSQL queries in a `Promise.all()` block to run them concurrently.
**Action:** Always verify validation queries (like user existence checks) are `await`ed first, then run the remaining independent queries concurrently using `Promise.all()`.
