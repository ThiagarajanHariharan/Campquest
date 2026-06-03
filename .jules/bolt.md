## 2024-06-03 - Avoid Object Reference Sharing in Promise Caches
**Learning:** When caching promises (e.g., in an `api()` wrapper) to deduplicate concurrent requests, cloning inside the cached promise itself causes concurrent callers awaiting the same promise to receive the exact same object reference. This can lead to state mutation vulnerabilities if components modify the returned data.
**Action:** Always deep clone (using `structuredClone` or JSON fallback) *after* awaiting the cached promise, so each caller receives a fresh copy.
