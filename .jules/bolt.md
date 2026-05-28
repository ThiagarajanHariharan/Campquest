## 2024-05-28 - [Performance]
**Learning:** Adding an in-memory short-TTL cache for API responses helps reduce redundant GET queries during React rendering in dev mode and rapid UI updates. Ensure that error handling for concurrent requests inside `inFlight` works gracefully.
**Action:** When working on frontend state, remember that rapid tab switching and StrictMode can generate redundant API requests. Use an in-flight Promise map combined with simple short-TTL caching and invalidate cache on mutations.
