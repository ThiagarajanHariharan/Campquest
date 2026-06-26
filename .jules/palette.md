## 2024-06-26 - Accessible Custom Div Toggles
**Learning:** Custom `div` toggles lack native keyboard support and semantic meaning, breaking accessibility for screen readers and keyboard users.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, `aria-label`, an `onKeyDown` handler (Space/Enter), and `:focus-visible` styles to custom interactive elements.
