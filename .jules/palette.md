## 2024-05-24 - Custom Div Toggles Accessibility
**Learning:** Custom `div`-based toggles in this app lacked keyboard interaction and screen reader support out of the box, breaking accessibility.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-labelledby`, and an `onKeyDown` handler (for "Enter" or "Space") when encountering `.toggle` components to ensure complete accessibility.
