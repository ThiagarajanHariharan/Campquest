## 2026-04-24 - Add authentication to admin endpoint
**Vulnerability:** Found unauthenticated admin endpoints (POST/PUT merchandise) in rewards-store-service, allowing anyone to modify inventory.
**Learning:** Admin endpoints were exposed without any authorization middleware or API key checks, likely due to rushed feature delivery.
**Prevention:** Always implement role-based access control or dedicated admin tokens for endpoints that modify system state or sensitive configurations.
