## 2024-10-24 - Do not leak internal system details via err.message
**Vulnerability:** HTTP 500 error responses exposed `details: err.message`, which leaks internal database or system details.
**Learning:** In Express microservices, `err.message` can contain sensitive information from the database connection or system state.
**Prevention:** Use a generic string like 'Internal Server Error' in the `details` field of 500 error responses to prevent information leakage, except for isolated diagnostic endpoints like `/health`.
