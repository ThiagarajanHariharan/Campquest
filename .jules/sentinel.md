## 2024-05-24 - Information Exposure in API Error Responses
**Vulnerability:** API error handlers were returning raw `err.message` in 500 status responses (e.g., `details: err.message`), which leaks internal database or system details to external clients.
**Learning:** Returning raw error objects or messages from catch blocks directly exposes internal system architecture, aiding attackers in mapping database structures or discovering other vulnerabilities.
**Prevention:** Catch blocks should log the raw error internally but return a generic, sanitized error string (or omit the details) to the client, except for isolated diagnostic endpoints like `/health`.
