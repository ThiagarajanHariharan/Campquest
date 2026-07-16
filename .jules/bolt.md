## 2024-07-16 - Bolt: Promise.all for independent queries
**Learning:** Sequential DB queries in Express routes that don't depend on each other's results create unnecessary latency bottlenecks.
**Action:** Always check if multiple `await pool.query(...)` calls in a route handler are independent. If they are, execute them concurrently using `Promise.all()` to speed up the response.
