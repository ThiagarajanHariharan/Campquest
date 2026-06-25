## 2026-06-25 - Information Exposure in Express 500 Responses
**Vulnerability:** Express microservices expose raw `err.message` in HTTP 500 and 503 response payloads (`details: err.message`), leaking internal system details.
**Learning:** Returning stack traces or internal database error messages to external clients constitutes an information exposure vulnerability that can aid attackers.
**Prevention:** Always use generic error messages like "Internal Server Error" for HTTP 500 responses unless it is an isolated `/health` diagnostic endpoint.
