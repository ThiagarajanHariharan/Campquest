## 2024-05-24 - Exposed Internal Details via Error Messages
**Vulnerability:** The backend microservices were returning raw `err.message` within HTTP 500 responses (`details: err.message`), exposing internal database or system details to external clients.
**Learning:** By returning unhandled system error messages directly to the client, we inadvertently risk leaking sensitive architectural information that could be exploited.
**Prevention:** Ensure that all standard API routes catch errors, log the detailed `err.message` internally (e.g., via `console.error`), and return a generic 'Internal Server Error' string to the client. Detailed error outputs should only be accessible on isolated diagnostic endpoints like `/health`.
