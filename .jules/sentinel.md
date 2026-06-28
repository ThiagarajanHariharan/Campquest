## 2024-05-24 - Prevent Error Detail Leakage
**Vulnerability:** HTTP 500 error responses in Express microservices exposed raw `err.message` in the JSON payload, potentially leaking internal database, system, or connection details to external clients.
**Learning:** This occurs when standard `catch(err)` blocks pass the caught exception directly to the API response without sanitization. While useful for debugging, it breaks the "fail securely" principle.
**Prevention:** Always use generic error strings (like 'Internal Server Error') for the response `details` or `message` property on 500 status codes, restricting the raw `err.message` or stack trace to server-side logging.
