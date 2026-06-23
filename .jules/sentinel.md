## 2024-06-23 - Information Leakage in Express Endpoints
**Vulnerability:** HTTP 500 endpoints exposed internal database errors or stack traces via `details: err.message` in the response body.
**Learning:** Returning unhandled database error messages directly exposes backend structures and query shapes to attackers.
**Prevention:** Catch unhandled exceptions and return a generic 'Internal Server Error' string to the client, while logging the actual error message server-side only.