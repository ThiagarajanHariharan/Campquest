## 2026-06-04 - Optimize database queries in fitness-sync-service
**Learning:** Sequential database queries block each other and increase response time unnecessarily.
**Action:** Use `Promise.all` to run independent database queries concurrently, significantly improving response times.
