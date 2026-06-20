## 2024-06-20 - [Accessible Custom Toggles]
**Learning:** The application uses custom `div`-based switch components (`.toggle`) that lack keyboard accessibility and semantic roles, making them unusable for screen readers and keyboard users.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and an `onKeyDown` handler to capture 'Enter'/'Space' to all custom `div`-based toggles.
