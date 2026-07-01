## 2024-07-01 - Error Information Leakage
**Vulnerability:** HTTP 500 responses exposed raw system/database error messages (via `err.message`) to external clients.
**Learning:** Returning unhandled exceptions or detailed error logs directly in responses leaks internal implementation details and can aid attackers in reconnaissance.
**Prevention:** Always map internal errors to generic, non-informative strings (like 'Internal Server Error') for production-facing 500 status codes. Reserve detailed errors for internal logging or isolated `/health` endpoints.
