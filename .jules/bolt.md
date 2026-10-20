## 2024-10-20 - Promise.all Optimization for Backend Queries
**Learning:** While `Promise.all` is discouraged for frontend API calls to preserve progressive rendering, it is highly effective and recommended for parallelizing independent database queries within backend microservices (e.g., Express route handlers) to minimize endpoint latency.
**Action:** Apply `Promise.all` to concurrent database queries in backend services to reduce overall response time.
