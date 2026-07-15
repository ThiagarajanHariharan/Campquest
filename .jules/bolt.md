## 2024-07-15 - Optimize Independent Queries with Promise.all
**Learning:** In backend Express microservices, route handlers often execute independent PostgreSQL queries sequentially after a validation query, resulting in longer response times.
**Action:** Wrap independent queries in a \`Promise.all()\` block to run them concurrently, ensuring validation queries (like user existence checks) are always \`await\`ed first before executing the remaining heavy queries.
