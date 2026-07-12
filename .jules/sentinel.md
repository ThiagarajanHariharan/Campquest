## 2024-05-24 - Information Exposure in Error Responses
**Vulnerability:** HTTP 500 error responses exposed raw `err.message` details to clients.
**Learning:** Returning raw error messages or stack traces leaks internal database or system state which could aid an attacker.
**Prevention:** Always return generic error messages (e.g., 'Internal Server Error') to external clients and log the detailed error internally.
