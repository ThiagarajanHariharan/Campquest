## 2024-10-24 - Prevent Information Leakage in HTTP 500 Responses
**Vulnerability:** Raw `err.message` was exposed in HTTP 500 error response payloads across all microservices.
**Learning:** Returning database or internal system error messages directly to clients leaks sensitive internal architecture details, which can be exploited by attackers.
**Prevention:** Use generic error strings like 'Internal Server Error' for external 500 responses. Detailed error messages should only be logged internally, with the exception of isolated `/health` diagnostic endpoints.
