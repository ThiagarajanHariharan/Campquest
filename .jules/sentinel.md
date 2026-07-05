## 2024-05-24 - Do not leak internal error details on HTTP 500
**Vulnerability:** HTTP 500 error handlers were leaking raw internal database error messages (`err.message`) in JSON responses (`details: err.message`).
**Learning:** These exposed stack traces or low-level messages can reveal database schema or sensitive inner workings to external users/attackers.
**Prevention:** Avoid returning raw error messages to clients. Use generic text like "Internal Server Error" for `500` status codes, though it's acceptable for isolated `/health` checks.
