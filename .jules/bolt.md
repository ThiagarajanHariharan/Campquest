## 2024-08-10 - Concurrency in Independent Queries
**Learning:** In Express route handlers, sequentially executing multiple independent PostgreSQL queries (like fetching activities and statistics) adds unnecessary latency and bottlenecks response times.
**Action:** Always identify independent database queries that follow an awaited validation query, and wrap them in a `Promise.all()` block to execute them concurrently, adding an explanatory `// OPTIMIZATION:` comment alongside the change.
