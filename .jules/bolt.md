## 2024-07-14 - Concurrent Database Queries
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially, which needlessly increases request latency.
**Action:** Optimize route handlers by wrapping independent queries in a Promise.all() block to run them concurrently, but always await validation queries (e.g., checking user existence for an early 404 return) first before executing the remaining heavy queries.
