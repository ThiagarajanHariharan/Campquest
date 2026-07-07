## 2024-07-07 - Concurrent Database Queries
**Learning:** Found a common anti-pattern where independent PostgreSQL queries in backend microservices are executed sequentially after validation.
**Action:** Always wrap independent secondary queries in `Promise.all()` to run them concurrently, significantly reducing response latency, while ensuring validation queries run first.
