## 2024-07-15 - Accessible Custom Switches
**Learning:** Custom `div`-based toggles lack native semantic meaning and keyboard interactions, rendering them invisible to screen readers and inaccessible to keyboard users.
**Action:** Always add `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate label, and an `onKeyDown` handler for 'Enter' and 'Space' keys (with `e.preventDefault()`) when implementing non-native interactive toggles, along with a `:focus-visible` CSS outline.
