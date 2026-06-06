## 2024-05-18 - Missing Authorization on Admin Endpoints
**Vulnerability:** Admin endpoints for creating and updating merchandise in the Rewards-Store service lacked authorization checks, allowing any user to call them.
**Learning:** Even if an endpoint is labeled as "(admin)" in comments or documentation, programmatic enforcement via role-based access control (RBAC) must be explicitly implemented.
**Prevention:** Implement role verification (e.g., checking `req.headers['x-role']`) on all sensitive routes.