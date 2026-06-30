## 2024-06-30 - Custom Switch Toggle Accessibility
**Learning:** Custom `div`-based switch toggles (like SettingsDrawer theme/notification toggles) block keyboard navigation and screen readers if they only rely on `onClick`.
**Action:** Always enhance custom `div` switches with `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, an `onKeyDown` handler for 'Enter'/'Space' (with `e.preventDefault()`), and a `:focus-visible` CSS outline to ensure full accessibility.
