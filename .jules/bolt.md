## 2024-06-19 - Concurrent DB queries
**Learning:** Running independent PostgreSQL queries sequentially is a common performance anti-pattern. Wrapping them in Promise.all() to run concurrently reduces overall request latency. However, early exit validation queries must be awaited first.
**Action:** Always identify independent database queries in a single route handler and use Promise.all() after necessary validations.
