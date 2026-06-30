## 2025-02-27 - Replace err.message leakage in Express JSON responses
**Vulnerability:** Details of error messages (e.g. database schema details or queries on connection failure) leaked via `details: err.message` in 500 responses across multiple services.
**Learning:** Returning `err.message` verbatim in an API response reveals internal details and backend state to potential attackers, which might aid in crafting specific injection attacks or profiling the backend infrastructure.
**Prevention:** Do not append raw error variables to HTTP responses on internal failures. Use generic fallback texts such as 'Internal Server Error', logging the raw error structure only on the server side console.
