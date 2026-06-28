## 2025-02-23 - Custom Div Toggles

**Learning:** Custom `div` elements used as switch toggles require an `onKeyDown` handler to capture 'Enter' and 'Space' keys. Crucially, `e.preventDefault()` must be called for the 'Space' key to prevent the default browser behavior of scrolling the page downwards.
**Action:** Always include `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-labelledby`, and an `onKeyDown` handler calling `e.preventDefault()` when implementing custom `div`-based switch toggles.
