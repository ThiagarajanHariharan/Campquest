## 2024-05-24 - Information Leakage in API Error Responses
**Vulnerability:** Express route handlers returned raw `err.message` in HTTP 500 responses, exposing internal database or system details to external clients.
**Learning:** Defaulting to passing the raw error object's message in JSON responses is a common anti-pattern that can leak sensitive system information.
**Prevention:** Always use generic error strings like 'Internal Server Error' for 500 status codes, restricting raw error details to isolated `/health` diagnostic endpoints or secure backend logging.
