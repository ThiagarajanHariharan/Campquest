## 2024-07-20 - Concurrent Independent Queries with Validation First
**Learning:** In backend Express microservices, route handlers often have multiple independent data fetching queries following an initial validation query (e.g., checking if a user exists). Running these heavy queries sequentially creates unnecessary latency.
**Action:** Always wrap independent read queries in a `Promise.all()` block to run them concurrently, ensuring the initial validation query is always `await`ed first before executing the concurrent batch.
