## 2024-10-22 - Parallelizing Independent DB Queries
**Learning:** Promise.all is restricted for independent API calls in the React frontend to preserve progressive rendering, but it is a recommended pattern for optimizing backend microservices in this repository by parallelizing independent database queries (e.g., in Express route handlers) to reduce endpoint latency.
**Action:** Use Promise.all to run independent database queries concurrently in backend microservices to improve response time and throughput.
