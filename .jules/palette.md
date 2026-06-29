## 2024-05-24 - Accessible Custom Toggles
**Learning:** Custom `div`-based switch toggles fail screen reader and keyboard accessibility without specific ARIA roles (`role="switch"`), states (`aria-checked`), and keyboard event handlers (`onKeyDown` for Space/Enter).
**Action:** Always enhance custom `.toggle` elements with `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-labelledby` or `aria-label`, a keyboard handler preventing default scroll, and `:focus-visible` styling.
