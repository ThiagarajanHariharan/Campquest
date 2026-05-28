## 2024-05-24 - Missing Authorization Check on Admin Endpoints in Rewards Store Service
**Vulnerability:** The `POST /api/rewards/merchandise` and `PUT /api/rewards/merchandise/:merchandiseId` endpoints in the `rewards-store-service` allow any user to add or modify merchandise without proper authorization checks.
**Learning:** This existed because the endpoints lacked validation of the `x-role` custom HTTP header.
**Prevention:** Always validate user roles or permissions on endpoints that perform sensitive operations, such as creating or updating data, especially for administrative actions.
