## 2024-08-24 - Missing Integer Validation for Query Parameters
**Vulnerability:** Unparsed limit query parameter passed directly into a parameterised database query
**Learning:** PostgreSQL's pg driver throws an error if an unparsed string is passed for an integer parameter like LIMIT $1
**Prevention:** Always parse and validate integer parameters like limit before pushing them into the query parameters array
