## 2026-06-08 - Icon Buttons Need ARIA Labels
**Learning:** Icon-only buttons lack accessible names by default, which is an accessibility anti-pattern. Adding `aria-label` provides necessary context to screen reader users.
**Action:** Add `aria-label` attributes to all instances of `.icon-btn` that only contain an emoji or icon character.

## 2026-06-08 - Accessible Custom Toggles
**Learning:** Custom switch toggles implemented using `div` elements are inaccessible to keyboard and screen reader users by default.
**Action:** Add `role="switch"`, `aria-checked`, `tabIndex={0}`, `aria-label`, and an `onKeyDown` handler to capture 'Enter' or 'Space' key presses for `div`-based toggles.
