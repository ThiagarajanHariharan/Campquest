## 2024-10-27 - Backend Promise.all Optimization
**Learning:** While Promise.all is restricted in the React frontend for independent API calls, it is a recommended pattern for optimizing backend microservices in this repository by parallelizing independent database queries.
**Action:** Use Promise.all to parallelize independent database queries in Express route handlers to reduce endpoint latency.
