## 2024-06-05 - Missing Role-Based Access Control on Admin Endpoints
**Vulnerability:** The POST and PUT endpoints for managing merchandise in `rewards-store-service` were explicitly intended for admins but lacked any authorization checks, allowing any user to create or update merchandise.
**Learning:** The application lacks a centralized authentication/authorization gateway, relying on individual microservices to verify headers (e.g., `x-role`). When creating new administrative endpoints, it's easy to overlook adding these manual checks.
**Prevention:** Ensure all route handlers that perform administrative actions explicitly validate the `x-role` custom HTTP header.
