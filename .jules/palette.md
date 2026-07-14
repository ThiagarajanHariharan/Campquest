## 2024-07-14 - Custom Toggle Switch Keyboard Accessibility
**Learning:** Custom `div`-based toggles frequently lack basic keyboard navigation and ARIA attributes (e.g. `role="switch"`, `aria-checked`), making them completely inaccessible to screen readers and keyboard-only users.
**Action:** Always verify that custom UI elements functioning as buttons or switches receive proper roles, keyboard event handlers (`onKeyDown` for Enter/Space), and `:focus-visible` styling. Additionally, always add `aria-label` to icon-only buttons.
