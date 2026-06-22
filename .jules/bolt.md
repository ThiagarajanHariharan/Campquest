## 2024-05-24 - Optimize independent sequential database queries in Express route handlers
**Learning:** A common performance anti-pattern is executing independent PostgreSQL queries sequentially in an API route. Running these queries concurrently with `Promise.all()` significantly improves response times. Wait on early validation queries before running heavier data-fetching concurrently.
**Action:** Wrap independent query tasks in `Promise.all()` after initial user validation checks in all Express endpoints fetching multiple data models.
