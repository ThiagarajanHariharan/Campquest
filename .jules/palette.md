## 2025-03-08 - Accessible Custom Toggles
**Learning:** Custom div-based switches (like `.toggle`) are completely inaccessible to keyboard and screen reader users out-of-the-box in this application.
**Action:** Always ensure custom toggles are made fully accessible by adding `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-labelledby`, an `onKeyDown` handler to capture 'Enter' or 'Space' key presses (using `e.preventDefault()` to prevent page scroll), and providing a clear `:focus-visible` CSS outline for keyboard navigation.
