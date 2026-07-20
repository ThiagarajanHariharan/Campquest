## 2026-07-20 - Prevent Information Leakage in API Responses
**Vulnerability:** Raw error messages (err.message) were exposed in HTTP 500 error responses across multiple microservices.
**Learning:** Exposing internal error messages leaks database structure and system details to clients, which can be exploited by attackers.
**Prevention:** Always use generic error strings like 'Internal Server Error' for 500 status codes, restricting detailed error messages to secure internal logging or isolated diagnostic endpoints.
