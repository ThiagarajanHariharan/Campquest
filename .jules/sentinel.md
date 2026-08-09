## 2024-08-09 - Fix error information leakage in API responses
**Vulnerability:** API endpoints were leaking raw error messages (including potentially sensitive database errors) via the `details: err.message` field in 500 response bodies.
**Learning:** Returning `err.message` verbatim in production can leak internal query structure, table names, or missing columns (e.g., PostgreSQL query failure strings), aiding attackers in mapping the backend.
**Prevention:** Catch blocks should log the raw error internally (`console.error(err)`) but only return a generic, sanitized error message to the client (e.g., `{ error: 'Failed to fetch data' }`).
