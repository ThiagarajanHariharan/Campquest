## 2026-08-25 - Prevent 500 error on invalid query parameter in fitness sync service
**Vulnerability:** Unsanitized and unvalidated `limit` query parameter is concatenated in a SQL `LIMIT` clause directly (by pushing a raw string into array that pg driver expects as an integer) causing `invalid input syntax for type bigint` 500 internal server error.
**Learning:** Database errors from invalid inputs ungracefully crashing queries leak stack traces and create DoS risks.
**Prevention:** Explicitly validate all user inputs (like `parseInt(limit, 10)`) and fail securely with 400 Bad Request before attempting to pass into database query parameters.
