## 2024-05-24 - Missing RBAC on Admin Endpoints
**Vulnerability:** Admin-only endpoints (`POST /api/rewards/merchandise`, `PUT /api/rewards/merchandise/:merchandiseId`) in the rewards-store-service lacked authorization checks, allowing any user to create or update merchandise.
**Learning:** The application does not use centralized token auth or a global middleware for roles. Instead, microservices must explicitly check the `x-role` custom HTTP header (e.g., `req.headers['x-role']`).
**Prevention:** Always verify `x-role` at the beginning of route handlers for sensitive or admin-only operations to enforce Role-Based Access Control (RBAC).
