## 2025-06-01 - Remove hardcoded database passwords
**Vulnerability:** Hardcoded credentials (DB password `campusquest_pass`) used as a fallback if the environment variable `DB_PASSWORD` was missing in Express apps.
**Learning:** Hardcoded credentials create a significant risk as they can be committed to the code repository, exposing the database to unauthorized access. By falling back to a hardcoded string, the application fails open securely and inadvertently hides configuration issues.
**Prevention:** Remove all fallback strings for sensitive configuration parameters and rely solely on environment variables. Add middleware or initialization checks to ensure the app fails immediately and explicitly (e.g. returning 500 error) if required secrets are absent.
