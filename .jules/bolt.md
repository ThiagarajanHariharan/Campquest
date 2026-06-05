## 2024-05-18 - Optimize independent PostgreSQL queries to run concurrently
**Learning:** Found a common performance anti-pattern where independent PostgreSQL database queries were being executed sequentially.
**Action:** Used `Promise.all()` to parallelize these independent requests and significantly reduce overall request latency in backend route handlers.
