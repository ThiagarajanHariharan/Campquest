## 2024-06-11 - Optimize Sequential Database Queries
**Learning:** Sequential execution of independent PostgreSQL queries (e.g., fetching user activities and stats separately) causes unnecessary latency.
**Action:** Wrap independent query promises in `Promise.all()` to execute them concurrently.
