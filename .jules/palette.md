## 2024-05-18 - Accessible Custom Toggles
**Learning:** Custom div-based toggles break keyboard accessibility and screen reader support unless specifically engineered.
**Action:** Always ensure custom toggles use `role="switch"`, `aria-checked`, `tabIndex={0}`, an `aria-label`, and capture Space/Enter via `onKeyDown`.
