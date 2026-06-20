## 2024-06-20 - [SQL Injection in limit parameter in GET /api/fitness/activities]
**Vulnerability:** Found a SQL injection in `services/fitness-sync-service/src/index.js` where the `limit` parameter from the user is directly interpolated into the SQL query `ORDER BY fa.synced_at DESC LIMIT $' + (params.length + 1);` but wait, `params.length + 1` is actually the index, so it IS parameterized! `LIMIT `.
**Learning:** Parameter indexes dynamically created with string concatenation are still secure if the value goes in `params.push(value)`.
**Prevention:** Keep using parameterization.
## 2024-06-20 - [Stack Traces Exposed via err.message]
**Vulnerability:** Found multiple instances where `err.message` is returned in HTTP 500 responses across all microservices (e.g., `res.status(500).json({ error: 'Failed to fetch merchandise', details: err.message });`). This leaks internal database structure and error specifics.
**Learning:** In a production microservice environment, raw error messages from PostgreSQL or the Node runtime should not be propagated directly to clients to prevent reconnaissance.
**Prevention:** Return a generic `details: 'Internal Server Error'` or log the error message server-side while omitting it from the response payload.
## 2024-06-20 - [Weak Password Hashing / Client-Side Hashing Assumption]
**Vulnerability:** The `POST /api/fitness/user` endpoint accepts `password_hash` directly from the client and inserts it into the database without any server-side hashing (e.g., bcrypt). This implies the client hashes the password (insecure, allows pass-the-hash attacks) or it's stored insecurely.
**Learning:** Password hashing must always occur on the server side using a strong salt and algorithm like bcrypt to prevent the exact hash from being intercepted and used for authentication.
**Prevention:** Accept plain passwords from clients over TLS, and hash them on the server before storage.
