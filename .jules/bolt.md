## 2024-07-11 - Independent Queries Executed Sequentially
**Learning:** Backend microservices frequently execute independent PostgreSQL queries sequentially after initial validation, creating an N+1 delay pattern.
**Action:** Always wrap independent post-validation queries (like fetching related entities and aggregates) in `Promise.all()` to execute them concurrently, while ensuring the initial validation query is awaited first for an early 404 return.
