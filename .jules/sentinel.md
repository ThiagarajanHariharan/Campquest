## 2024-08-03 - Exposing Internal Errors
**Vulnerability:** Found multiple instances where error messages (`err.message`) were leaked in HTTP 500 response bodies across all services (`res.status(500).json({ error: '...', details: err.message })`).
**Learning:** This exposes internal database structures or application details to end users.
**Prevention:** Avoid passing raw `err.message` in the JSON response payload. Use a sanitized generic error, and ensure we log the raw error internally using `console.error(err)`.
