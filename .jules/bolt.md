## 2024-05-23 - Independent Sequential PostgreSQL Queries
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially (e.g., fetching stats and recent activities separately after user validation).
**Action:** Optimize these route handlers by wrapping the independent queries in a `Promise.all()` block to run them concurrently, always awaiting validation queries (e.g., checking user existence) first.
