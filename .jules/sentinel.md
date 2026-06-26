## 2024-05-18 - Prevented Information Leakage in API Responses
**Vulnerability:** The API returned raw error messages (`details: err.message`) inside HTTP 500 error responses across multiple microservices (`fitness-sync-service`, `geolocation-service`, `merchant-stall-service`, `rewards-store-service`). This leaked internal application logic, database, and system details to clients.
**Learning:** Returning raw internal error messages externally is a severe information leakage risk, as it provides attackers with insight into the backend system that they can exploit.
**Prevention:** Always mask the detailed error string by returning generic strings like `'Internal Server Error'` to the user, except in isolated `/health` diagnostic endpoints if required.
