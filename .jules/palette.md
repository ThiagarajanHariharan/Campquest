## 2025-01-20 - Accessible Custom Toggles
**Learning:** Custom div-based toggles missing standard accessible role, state, and keyboard support prevent users from accessing settings. Need to map `div` toggles to actual form controls using `role="switch"`, `aria-checked`, `tabIndex={0}`, and `onKeyDown`.
**Action:** Always add keyboard handlers (Enter/Space) and proper ARIA roles to non-standard interactive UI elements acting as inputs.
