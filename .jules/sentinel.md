## 2024-06-21 - Remove raw err.message from 500 responses
**Vulnerability:** API endpoints were returning raw `err.message` values in 500 HTTP responses, exposing internal database or system details to external clients.
**Learning:** In backend Express microservices, exception catch blocks often leak internal stack traces or connection strings if the `err` object is directly serialized to the client.
**Prevention:** Ensure 500 errors only return generic strings like "Internal Server Error" or "Failed to fetch data" and restrict raw `err.message` exposures to isolated `/health` diagnostic endpoints.
