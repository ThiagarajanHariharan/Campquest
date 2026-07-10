## 2024-05-24 - Custom div toggles require explicit accessibility
**Learning:** This app implements custom switch toggles using `div` elements (`.toggle`). They lack keyboard navigability and screen reader semantics by default.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and an `onKeyDown` handler to capture 'Enter' or 'Space' for custom interactive components, along with a `:focus-visible` outline.
