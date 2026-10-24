## 2024-10-24 - Hardcoded database secrets in process.env fallback
**Vulnerability:** A hardcoded fallback password ('campusquest_pass') was found in the database connection configuration across all four microservices.
**Learning:** Hardcoded fallbacks are often introduced for local development convenience but expose the application to critical security risks if deployed to production without the corresponding environment variables set.
**Prevention:** Remove hardcoded fallback passwords from production-bound configurations. Rely exclusively on explicitly configured environment variables (like `DB_PASSWORD`), forcing the application to fail securely rather than connecting with a known default credential.
