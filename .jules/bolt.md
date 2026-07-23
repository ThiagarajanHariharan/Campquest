## 2024-07-23 - Concurrent Database Queries in Route Handlers
**Learning:** Independent database queries in Express route handlers (like fetching user activities and aggregate stats) were being executed sequentially, unnecessarily increasing overall endpoint latency.
**Action:** Wrap independent PostgreSQL queries in a `Promise.all()` block to run them concurrently, ensuring validation queries (like user existence checks) are always `await`ed first before executing the remaining heavy queries.
