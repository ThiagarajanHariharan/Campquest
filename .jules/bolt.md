## 2024-05-28 - Independent Query Concurrency Optimization
**Learning:** Sequential execution of independent database queries is a recurring anti-pattern that creates measurable latency bottlenecks in backend microservices.
**Action:** Always wrap independent Postgres queries (like fetching user details and user statistics) in a `Promise.all()` block to run them concurrently, effectively halving the database wait time for those operations. Always ensure validation queries run sequentially first to fail fast.
