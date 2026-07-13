## 2026-07-13 - Replace verbose error messages in API responses
**Vulnerability:** Found `err.message` being directly exposed in 500 error responses across all microservices (e.g., `res.status(500).json({ error: 'Failed to ...', details: err.message });`).
**Learning:** Returning raw database or system error messages in API responses can leak sensitive internal details (such as table names, field types, SQL syntax details, or directory structures), facilitating further attacks.
**Prevention:** Always sanitize 500 error responses and return generic messages like "Internal Server Error" to external clients, while logging the actual `err.message` securely on the server side using a logging library or `console.error`.
