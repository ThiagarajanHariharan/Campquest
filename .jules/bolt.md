## 2024-05-24 - Concurrent Queries
**Learning:** Found a common anti-pattern in backend microservices where independent PostgreSQL queries were being executed sequentially after validation.
**Action:** Always look for independent data fetching operations after early-return validation checks and wrap them in `Promise.all()` to execute them concurrently, reducing total response time.
