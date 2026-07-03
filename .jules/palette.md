## 2024-07-03 - Accessible Custom Toggles
**Learning:** Custom div-based toggles used in the app lack native keyboard and screen reader support, creating an accessibility barrier.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, `aria-label` or `aria-labelledby`, `onKeyDown` support for Space/Enter, and `:focus-visible` styles to make them accessible.
