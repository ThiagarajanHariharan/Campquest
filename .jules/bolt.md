## 2024-05-25 - Concurrent Database Queries in Microservices
**Learning:** Express route handlers in this application frequently execute independent PostgreSQL queries sequentially (e.g., fetching a user's activities and stats).
**Action:** Use `Promise.all()` to run these independent queries concurrently, but only after awaiting the validation queries (like checking if the user exists).