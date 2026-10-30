## 2024-10-30 - Backend Query Parallelization
**Learning:** While Promise.all is restricted for independent API calls in the React frontend to preserve progressive rendering, it is a recommended pattern for optimizing backend microservices in this repository by parallelizing independent database queries to reduce endpoint latency.
**Action:** Use Promise.all to execute independent database queries concurrently in Express route handlers to minimize response time.
