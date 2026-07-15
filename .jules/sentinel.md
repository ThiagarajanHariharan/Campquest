## 2024-05-24 - Do not leak internal system details via err.message
**Vulnerability:** HTTP 500 error handlers returned raw `err.message` properties to external clients.
**Learning:** Database schema details, file paths, or third party service internals might leak in the `err.message`, potentially leading to exploitation or discovery phases.
**Prevention:** Always use generic strings for Internal Server Error messages on externally facing APIs, avoiding returning `err.message`.
