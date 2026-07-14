## 2024-07-14 - Prevent Information Leakage in Error Responses
**Vulnerability:** HTTP 500 error responses were returning raw `err.message` from the database pool directly to the client via `details: err.message`. This exposed internal stack traces and database errors to potential attackers, which could aid in understanding the backend architecture for exploitation.
**Learning:** This existed because it's easier to debug during development, but the lack of error handling abstraction caused internal info leakage to persist in production APIs.
**Prevention:** Always abstract technical error messages to generic messages (like 'Internal Server Error') before responding to the client, while preserving the raw error in internal logging.
