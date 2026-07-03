## 2026-07-03 - Execute independent queries concurrently
**Learning:** A common performance anti-pattern in the backend microservices is executing independent PostgreSQL queries sequentially.
**Action:** Optimize these route handlers by wrapping the independent queries in a `Promise.all()` block to run them concurrently. However, always await validation queries (e.g., checking user existence for an early 404 return) first before executing the remaining heavy queries concurrently.
