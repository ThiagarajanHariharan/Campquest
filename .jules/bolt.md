## 2024-05-18 - Concurrent Database Queries Optimization

**Learning:** Optimizing sequential database queries in an Express endpoint when fetching a user's data and stats. While they don't depend on each other, they were executed sequentially. Grouping them with `Promise.all` reduced query time without sacrificing readability. We should be careful to fetch validation/early exit queries first and then `await Promise.all` for the independent ones to avoid unnecessary database queries on error paths.
**Action:** When working on APIs with independent data fetching requirements, I will always consider using `Promise.all` after early exits to decrease loading times.
