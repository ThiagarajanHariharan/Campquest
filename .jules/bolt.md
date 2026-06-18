## 2024-05-15 - Concurrent DB Queries Optimization
**Learning:** Sequential, independent database queries are a common performance anti-pattern in Express backend microservices that adds unnecessary latency to endpoints (N+1 query problem).
**Action:** When multiple independent database queries are needed (e.g. fetching separate pieces of related data for a response), wrap them in a `Promise.all()` block so they execute concurrently. Always await any necessary validation query (like checking if a user exists) *before* the concurrent block to fail fast and prevent wasting database resources.
