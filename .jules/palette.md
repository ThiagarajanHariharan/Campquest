## 2024-06-25 - Make Custom Toggle Switches Accessible
**Learning:** Custom `div`-based switch toggles are completely inaccessible to keyboard and screen reader users by default. This application relies on them for critical settings.
**Action:** When working with custom `.toggle` elements, always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, an `onKeyDown` handler to capture 'Enter' or 'Space' key presses (preventing default scroll), and a clear `:focus-visible` CSS outline.
