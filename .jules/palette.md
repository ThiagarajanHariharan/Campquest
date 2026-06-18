## 2024-06-18 - Accessible custom div toggles
**Learning:** Custom div toggles used as switches in this app lack native keyboard accessibility and screen reader support (missing roles, states, and keyboard events).
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and an `onKeyDown` handler (for 'Enter' or 'Space') to custom `div` toggles.