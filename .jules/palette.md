## 2024-05-24 - Custom div-based components accessibility
**Learning:** Custom div-based toggles (`.toggle`) in the SettingsDrawer lack native semantic roles, states, and keyboard event handlers, breaking accessibility for keyboard and screen reader users. Additionally, emoji-based icon-only buttons lack `aria-label`s.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, and `onKeyDown` handlers to custom div toggles, use `:focus-visible` for visual outlines, and add descriptive `aria-label`s to all icon-only buttons.
