## 2024-07-11 - Custom Div Toggles Accessibility
**Learning:** Custom `div`-based switch toggles (like `.toggle`) are entirely invisible to screen readers and keyboard users unless explicitly managed. Unlike `<button>` or `<input type="checkbox">`, they do not receive focus or respond to keyboard events natively.
**Action:** Always ensure custom toggles have `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, an `onKeyDown` handler (for 'Enter' and 'Space'), and clear `:focus-visible` styles.
