## 2026-07-24 - Prevent Information Disclosure via Error Messages
**Vulnerability:** Internal server errors (HTTP 500) were exposing the raw `err.message` (which can contain SQL query errors or file paths) directly to the client in the API JSON responses.
**Learning:** This is a common pattern in Express.js applications where error handlers naively pass the caught error object to the response body for debugging purposes, violating the 'fail securely' principle in production.
**Prevention:** Always catch and log the raw error on the server side (e.g., using `console.error`), but send a generic, safe string like 'Internal Server Error' in the `details` field of the HTTP response to avoid leaking internal architecture specifics.
