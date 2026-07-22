## 2024-10-25 - Information Exposure via Error Messages
**Vulnerability:** HTTP 500 error responses in Express microservices were exposing raw `err.message` and internal database details to clients.
**Learning:** Returning unhandled database error strings (like PostgreSQL errors) directly in API responses leaks system architecture, table names, and query structures, aiding attackers in reconnaissance.
**Prevention:** Catch all exceptions and return generic, safe error strings (e.g., 'Internal Server Error') to clients while logging the actual `err.message` securely on the server backend. Health check endpoints can be an exception for diagnostic monitoring.
