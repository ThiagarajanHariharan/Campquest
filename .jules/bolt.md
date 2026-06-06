## 2024-05-18 - Concurrent Queries in Express Route Handlers
**Learning:** In the backend microservices, independent PostgreSQL queries are often executed sequentially in route handlers (e.g., fetching activities and stats after fetching a user). This is an N+1/sequential execution anti-pattern.
**Action:** Optimize these route handlers by wrapping the independent queries in a `Promise.all()` block to run them concurrently, significantly reducing the total response latency.
