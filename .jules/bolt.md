## 2024-05-24 - Parallelize independent queries
**Learning:** Found a common anti-pattern where independent database queries are executed sequentially.
**Action:** Use `Promise.all` to run independent queries concurrently after initial validation to reduce overall response time.
