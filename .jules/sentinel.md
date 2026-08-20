## 2026-08-20 - Unparsed Query Parameter Causing 500 Error
**Vulnerability:** Passing unparsed string query parameters (like `limit=10abc`) into PostgreSQL `pg` driver array parameters for clauses expecting integers causes a 500 Internal Server Error.
**Learning:** Express `req.query` parameters are strings. If passed directly to Postgres parameterized queries where an integer is expected, the query fails with a Type mismatch (e.g., invalid input syntax for type bigint), leading to unhandled database errors exposed to users.
**Prevention:** Always explicitly parse and validate integer parameters from user input (e.g., using `parseInt(limit, 10)` and checking `isNaN`) before pushing them into the query parameters array.
