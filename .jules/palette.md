## 2026-06-13 - Custom Toggle Accessibility Pattern
**Learning:** Custom `div` toggles found in this application (`<div className="toggle">`) were inaccessible to screen readers and keyboard users as they lacked semantic roles and keyboard event handlers.
**Action:** When working with custom visual `div` toggles in this app, ensure they act as accessible switches by adding `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-labelledby` or `aria-label`, and an `onKeyDown` handler for 'Enter' or 'Space' key presses.
