## 2025-01-01 - Accessible custom switch toggles
**Learning:** The app uses custom `div` elements for switch toggles (e.g. `.toggle`). Without standard keyboard navigation and ARIA attributes, they are completely inaccessible to keyboard and screen reader users.
**Action:** When implementing or modifying custom `div`-based switches, always add `role="switch"`, `aria-checked`, `tabIndex={0}`, keyboard event handlers for Enter/Space to prevent scrolling, and `:focus-visible` styling.
