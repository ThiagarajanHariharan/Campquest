## 2024-07-16 - Accessible Custom Div Toggles
**Learning:** Custom div toggles used in SettingsDrawer lack native accessibility, missing ARIA roles, checked states, and keyboard navigation.
**Action:** When working with custom div elements used as controls (like `.toggle`), always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and handle 'Enter'/'Space' keys using `onKeyDown`. Also ensure they have `:focus-visible` outlines.
