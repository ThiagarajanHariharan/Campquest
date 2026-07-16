## 2024-07-16 - Prevent Error Message Leakage in Express Endpoints
**Vulnerability:** Express endpoints return raw `err.message` inside 500 error responses.
**Learning:** Exposing internal error messages or stack traces to external clients leaks database structure, queries, or other system details.
**Prevention:** Always catch exceptions and return a generic 'Internal Server Error' string or code instead of the raw error object to external users, except possibly for strictly internal health checks.
