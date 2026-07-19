## 2024-05-24 - Express Route Concurrent Database Queries
**Learning:** In the Express microservice architecture, route handlers frequently validate user existence but then execute independent data-fetching queries sequentially, causing an unnecessary performance bottleneck.
**Action:** Always wrap independent post-validation PostgreSQL queries in a `Promise.all()` block to execute them concurrently, reducing total route response time while ensuring validation queries run first.
