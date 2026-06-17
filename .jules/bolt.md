## 2024-05-24 - Optimize independent database queries
**Learning:** Sequential execution of independent database queries causes unnecessary latency in backend microservices.
**Action:** Wrap independent PostgreSQL queries in a `Promise.all()` block to run them concurrently, after awaiting validation queries first.
