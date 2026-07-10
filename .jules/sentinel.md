## 2025-02-18 - Error Handling Information Leakage
**Vulnerability:** HTTP 500 responses exposed raw stack traces and internal database error messages (\`err.message\`) to end-users via the \`details\` field in error payloads.
**Learning:** Exposing internal error states can give attackers insights into database schema and system internals. Error handling must always sanitize public responses.
**Prevention:** Use generic error descriptions like "Internal Server Error" for external-facing API responses while relying on internal, non-public logging for diagnostic visibility.
