## 2025-02-14 - Optimize Backend Express Microservices Database Queries
**Learning:** Sequential database queries using `await pool.query(...)` inside backend route handlers lead to a measurable performance bottleneck. Waiting for independent queries to resolve sequentially increases latency.
**Action:** When handling routes that issue multiple independent queries (such as fetching user data, activities, and stats), wrap them in a `Promise.all()` block to execute them concurrently after validating prerequisite conditions.
