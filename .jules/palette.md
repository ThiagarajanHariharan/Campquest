## 2024-06-06 - Accessible div Toggles
**Learning:** Custom `div` elements acting as toggles or switches require explicit accessibility attributes (`role="switch"`, `aria-checked`, `tabIndex={0}`, `aria-label`) and keyboard handlers (like `onKeyDown` for 'Enter' or 'Space') to be usable by screen readers and keyboard users.
**Action:** Always ensure `div`-based custom interactive elements implement the correct ARIA roles, state attributes, and full keyboard interaction support matching standard interactive elements.
