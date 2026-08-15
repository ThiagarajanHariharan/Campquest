## 2024-08-15 - Unvalidated Query Parameter Passed to Parameterized Query
**Vulnerability:** A `limit` parameter from `req.query` was passed directly into a parameterized query array (`params.push(limit)`) for a `LIMIT` clause without validation or parsing.
**Learning:** While parameterized queries (`$1`) protect against classic SQL injection by treating input as literal values, passing unvalidated string input (like `?limit=invalid`) into clauses that expect integers (like `LIMIT`) causes the PostgreSQL driver to attempt parsing, resulting in a 500 error instead of a secure 400 rejection.
**Prevention:** Always validate and explicitly type-cast query parameters (e.g., `parseInt(limit, 10)`) before pushing them into the parameters array, even when using parameterized queries.
