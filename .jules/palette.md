## 2026-06-23 - Accessible Custom Toggles
**Learning:** Custom `div`-based switch components in this application lack native accessibility semantics, making them invisible to screen readers and inaccessible via keyboard navigation.
**Action:** Always enhance custom `div` toggles with `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and keyboard event handlers (`onKeyDown` for Space/Enter) to ensure full accessibility parity with native inputs, along with a `:focus-visible` CSS rule.
