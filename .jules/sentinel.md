## 2024-07-18 - Fix Information Leakage in 500 Responses
**Vulnerability:** Raw error messages (`err.message`) were directly exposed to end users via API responses in multiple services, leading to potential internal database and system information leakage.
**Learning:** Exposing internal error states can give attackers insights into database structures or system issues. Express apps need to enforce a boundary that sanitized errors are returned on 500s.
**Prevention:** Catch blocks for standard API responses should always return generic "Internal Server Error" details instead of the raw `err.message`, except for internal diagnostic endpoints like `/health`.
