## 2024-05-15 - Prevent Information Leakage in HTTP 500 Responses
**Vulnerability:** HTTP 500 error handlers across all microservices returned raw `err.message` details to external clients.
**Learning:** Directly exposing underlying system or database errors in API responses can reveal internal architecture, database schema, or technology stack details, increasing the attack surface.
**Prevention:** Implement a pattern of logging the detailed error internally and returning a generic string like 'Internal Server Error' to the client.
