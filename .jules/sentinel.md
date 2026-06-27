## 2024-06-27 - Exposed Error Details in API Responses
**Vulnerability:** The application was exposing the internal database error messages (`err.message`) in the `details` field of the JSON responses to the client when a 500 internal server error or a database error occurs.
**Learning:** Returning database error messages could leak sensitive details regarding the internal database schema, user data, or queries which can be helpful for attackers to craft SQL injection payloads or enumerate internal systems.
**Prevention:** Always catch and log error messages internally on the server but avoid exposing them directly to the user. Instead, return a generic error message such as 'Internal Server Error' in the API response.
