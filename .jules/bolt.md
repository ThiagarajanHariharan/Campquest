## 2024-10-23 - Backend Promise.all
**Learning:** Promise.all is a recommended pattern for optimizing backend microservices in this repository by parallelizing independent database queries (e.g., in Express route handlers) to reduce endpoint latency.
**Action:** Use Promise.all to run independent `pool.query` database queries concurrently instead of sequentially with `await` in the same backend request handler.
