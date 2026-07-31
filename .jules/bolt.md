## 2024-07-31 - Optimize Independent Database Queries
**Learning:** In the backend Express microservices, route handlers often perform independent PostgreSQL queries (e.g., fetching activities and statistics) sequentially.
**Action:** Always wrap independent database queries in a `Promise.all()` block to run them concurrently, ensuring validation queries are awaited first.
