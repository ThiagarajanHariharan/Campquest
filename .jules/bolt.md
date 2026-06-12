## 2026-06-12 - Concurrent Database Queries
**Learning:** Executing independent PostgreSQL queries sequentially is a performance anti-pattern in the backend microservices that increases response latency unnecessarily.
**Action:** Optimize route handlers by wrapping independent database queries in a Promise.all() block to run them concurrently.
