## 2024-10-31 - [Prevent Information Leakage in Error Responses]
**Vulnerability:** [Internal error details (err.message) were exposed in HTTP 500 responses across microservices]
**Learning:** [This occurred because error messages were directly mapped into API response payloads, failing to fail securely]
**Prevention:** [Never expose backend stack traces or raw error properties to the client; always log internally and return generic error messages instead]
