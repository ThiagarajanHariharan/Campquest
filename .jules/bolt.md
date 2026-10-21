## 2023-10-21 - Parallelized Independent Queries
**Learning:** In the fitness sync service, the `user` endpoint fetches both the recent activities and total stats in separate database queries. This introduces unnecessary latency.
**Action:** Used `Promise.all` to run these independent queries concurrently. Parallelizing database queries is a solid optimization pattern for backend performance.
