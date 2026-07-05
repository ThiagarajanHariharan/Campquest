## 2024-07-05 - Concurrent Independent Queries
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially.
**Action:** Optimize route handlers by wrapping independent queries in a `Promise.all()` block to run them concurrently. However, always await validation queries (e.g., checking user existence for an early 404 return) first before executing the remaining heavy queries concurrently.
