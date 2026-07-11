## 2024-05-15 - Information Disclosure via Error Details
**Vulnerability:** HTTP 500 error handlers across all microservices returned raw `err.message` in JSON response payloads.
**Learning:** Returning raw database or system error messages in API responses can inadvertently leak sensitive internal details to external clients.
**Prevention:** Always use generic error messages (like 'Internal Server Error') in the response payload for HTTP 500 errors, while logging the actual `err.message` securely on the server side.
