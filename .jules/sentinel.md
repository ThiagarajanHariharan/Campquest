## 2024-05-30 - Fix missing RBAC header check on admin endpoints
**Vulnerability:** The rewards store service had administrative endpoints (`POST /api/rewards/merchandise`, `PUT /api/rewards/merchandise/:merchandiseId`) that were fully public, lacking any verification of the user's role.
**Learning:** In a decentralized microservices architecture without centralized token validation, relying entirely on UI logic to hide admin features leaves the underlying endpoints exposed to unauthorized direct API calls.
**Prevention:** Always enforce RBAC headers (e.g. `x-role`) within the endpoint handler logic itself, explicitly rejecting requests (403 Forbidden) that do not possess the required privileges.
