## 2024-10-24 - Concurrent Queries
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially.
**Action:** Optimize these route handlers by wrapping the independent queries in a Promise.all() block to run them concurrently, always ensuring validation queries are awaited first.
