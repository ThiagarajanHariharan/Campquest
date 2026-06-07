## 2024-06-07 - Optimize sequential independent DB queries
**Learning:** Multiple endpoints across microservices perform independent PostgreSQL queries sequentially (e.g. fetching a user, then their activities, then stats).
**Action:** Wrap independent queries in `Promise.all()` to execute them concurrently, reducing total response latency.
