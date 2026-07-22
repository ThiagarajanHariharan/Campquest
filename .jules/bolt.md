## 2024-07-22 - Concurrent Database Queries
**Learning:** Sequential database queries that don't depend on each other (after validation checks) create unnecessary blocking and slow down request times.
**Action:** Always wrap independent `pool.query` calls in a `Promise.all()` to execute them concurrently, being sure to `await` any validation queries (like existence checks) first.
