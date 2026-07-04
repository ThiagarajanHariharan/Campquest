## 2024-05-31 - Concurrent Independent Queries
**Learning:** Executing independent PostgreSQL queries sequentially in backend route handlers is a performance anti-pattern.
**Action:** Optimize these route handlers by wrapping the independent queries in a `Promise.all()` block to run them concurrently, always ensuring validation queries (e.g. checking user existence) are awaited first.
