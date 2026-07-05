## 2024-07-05 - Accessible Custom Switch Toggles
**Learning:** Custom `div`-based switch toggles (like `.toggle` in `SettingsDrawer`) lack native keyboard accessibility and screen reader support, rendering them unusable for many users.
**Action:** Always ensure custom `div` toggles include `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, an `onKeyDown` handler to capture 'Enter' or 'Space' key presses (using `e.preventDefault()` to prevent page scroll), and a clear `:focus-visible` CSS outline for keyboard navigation.
